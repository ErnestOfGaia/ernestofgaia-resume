"use client";

import { useState, useCallback } from "react";
import { resumeData } from "@/lib/resume";
import LibrarianChatPanel from "./LibrarianChatPanel";
import QuestionsLog from "./QuestionsLog";

const ALL_TABS = ["Historical", "Skills Based", "Passions", "Questions"] as const;
type Tab = (typeof ALL_TABS)[number];

// Questions tab exposes visitor questions — gate behind an explicit env var so
// it stays hidden on the public site unless Ernest opts in.
const SHOW_QUESTIONS_TAB = process.env.NEXT_PUBLIC_SHOW_QUESTIONS_TAB === "true";
const tabs: readonly Tab[] = SHOW_QUESTIONS_TAB
  ? ALL_TABS
  : ALL_TABS.filter((t): t is Tab => t !== "Questions");

const dreamingStates = [
  "Consulting the archives...",
  "Cross-referencing experience...",
  "Indexing relevant skills...",
  "Composing a response...",
  "Reviewing the catalog...",
];

interface ActiveViewProps {
  onSleep: () => void;
}

/**
 * Simple markdown renderer for agent responses
 * Handles: headers, lists, bold, italic, code blocks
 */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headers (###)
    if (line.startsWith("### ")) {
      elements.push(
        <h5
          key={`h5-${i}`}
          className="headline-sm"
          style={{ marginTop: "20px", marginBottom: "12px", fontWeight: 600 }}
        >
          {line.replace(/^### /, "")}
        </h5>
      );
      i++;
      continue;
    }

    // Headers (##)
    if (line.startsWith("## ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="headline-sm"
          style={{ marginTop: "24px", marginBottom: "16px", fontWeight: 600 }}
        >
          {line.replace(/^## /, "")}
        </h4>
      );
      i++;
      continue;
    }

    // Headers (#)
    if (line.startsWith("# ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="display-sm"
          style={{ marginTop: "24px", marginBottom: "16px" }}
        >
          {line.replace(/^# /, "")}
        </h3>
      );
      i++;
      continue;
    }

    // Lists (bullet points)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        listItems.push(
          <li key={`li-${i}`} style={{ marginBottom: "6px" }}>
            {parseInlineFormatting(lines[i].replace(/^[-*] /, ""))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          style={{
            paddingLeft: "1.75rem",
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "0",
            lineHeight: "1.8",
          }}
        >
          {listItems}
        </ul>
      );
      continue;
    }

    // Code blocks
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={`code-${elements.length}`}
          style={{
            backgroundColor: "var(--surface-container-high)",
            padding: "16px",
            borderRadius: "6px",
            overflow: "auto",
            marginBottom: "16px",
            fontSize: "0.85rem",
            lineHeight: "1.5",
          }}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Empty lines - add spacing
    if (!line.trim()) {
      elements.push(<div key={`spacer-${i}`} style={{ height: "12px" }} />);
      i++;
      continue;
    }

    // Regular paragraphs with inline formatting
    elements.push(
      <p
        key={`p-${i}`}
        className="body-md"
        style={{ marginBottom: "16px", lineHeight: "1.8", color: "var(--on-background)" }}
      >
        {parseInlineFormatting(line)}
      </p>
    );
    i++;
  }

  return <div style={{ display: "flex", flexDirection: "column" }}>{elements}</div>;
}

/**
 * Parse inline formatting: **bold**, *italic*, `code`
 */
function parseInlineFormatting(text: string) {
  const parts: React.ReactNode[] = [];
  let i = 0;

  while (i < text.length) {
    // Bold
    if (text.substring(i).startsWith("**")) {
      const endIdx = text.indexOf("**", i + 2);
      if (endIdx !== -1) {
        parts.push(
          <strong key={`bold-${i}`}>{text.substring(i + 2, endIdx)}</strong>
        );
        i = endIdx + 2;
        continue;
      }
    }

    // Italic
    if (text[i] === "*" && i + 1 < text.length && text[i + 1] !== "*") {
      const endIdx = text.indexOf("*", i + 1);
      if (endIdx !== -1) {
        parts.push(
          <em key={`italic-${i}`}>{text.substring(i + 1, endIdx)}</em>
        );
        i = endIdx + 1;
        continue;
      }
    }

    // Inline code
    if (text[i] === "`") {
      const endIdx = text.indexOf("`", i + 1);
      if (endIdx !== -1) {
        parts.push(
          <code
            key={`inline-code-${i}`}
            style={{
              backgroundColor: "var(--surface-container-high)",
              padding: "2px 6px",
              borderRadius: "3px",
              fontSize: "0.9em",
            }}
          >
            {text.substring(i + 1, endIdx)}
          </code>
        );
        i = endIdx + 1;
        continue;
      }
    }

    // Regular character
    parts.push(text[i]);
    i++;
  }

  return parts;
}

// Static fallback content rendered from resume data (shown before first agent fetch)
function StaticContent({ tab }: { tab: Tab }) {
  if (tab === "Questions") {
    return <QuestionsLog />;
  }

  if (tab === "Historical") {
    return (
      <>
        {resumeData.historical.map((role) => (
          <section key={role.title}>
            <h3 className="headline-sm">{role.title}</h3>
            <p className="label-md">{role.org}</p>
            <p className="label-md" style={{ marginBottom: "8px" }}>
              {role.period}
            </p>
            <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "4px" }}>
              {role.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }

  if (tab === "Skills Based") {
    return (
      <>
        {resumeData.skillsBased.map((group) => (
          <section key={group.category}>
            <h3 className="headline-sm">{group.category}</h3>
            <ul style={{ paddingLeft: "1.25rem", marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {group.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        ))}
      </>
    );
  }

  return (
    <>
      <section>
        <p style={{ fontStyle: "italic", fontSize: "1.125rem", marginBottom: "24px" }}>
          &ldquo;{resumeData.passions.quote}&rdquo;
        </p>
        <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "8px" }}>
          {resumeData.passions.themes.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="headline-sm" style={{ marginBottom: "12px" }}>
          Education & Credentials
        </h3>
        <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "4px" }}>
          {resumeData.passions.education.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function ActiveView({ onSleep }: ActiveViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Historical");
  const [isLoading, setIsLoading] = useState(false);
  const [agentContent, setAgentContent] = useState<Record<string, string>>({});
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [dreamState, setDreamState] = useState(dreamingStates[0]);
  const [isChatOpen, setIsChatOpen] = useState(true); // Open by default when librarian wakes up

  const fetchTabContent = useCallback(async (tab: Tab) => {
    if (tab === "Questions") {
      setIsLoading(false);
      return; // Questions tab is managed by QuestionsLog component
    }

    if (agentContent[tab]) return; // already fetched

    setIsLoading(true);
    const interval = setInterval(() => {
      setDreamState(dreamingStates[Math.floor(Math.random() * dreamingStates.length)]);
    }, 1800);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgentContent((prev) => ({ ...prev, [tab]: data.content }));
      }
    } catch {
      // silently fall back to static content
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }, [agentContent]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    fetchTabContent(tab);
  };

  const displayContent = agentContent[activeTab];

  const handleChatTabRequest = (tab: Tab) => {
    setActiveTab(tab);
    setExpandedContent(null); // Clear expanded view when switching tabs
    fetchTabContent(tab);
  };

  const handleExpandedContent = (content: string) => {
    setExpandedContent(content);
  };

  return (
    <div className="split-pane-container">
      {/* Left Pane: Librarian (hidden on mobile) */}
      <nav className="librarian-pane">
        <div
          className="librarian-visual"
          aria-hidden="true"
          style={{
            backgroundImage: "url(/awake-librarian.png)",
            backgroundPosition: "left center",
            backgroundSize: "auto 100%",
          }}
        />
        <div className="librarian-actions">
          <a
            href="https://ernestofgaia.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ width: "100%", marginBottom: "12px" }}
          >
            🌍 Travel to ernestofgaia.xyz
          </a>
          <a
            href="mailto:eog@ernestofgaia.xyz"
            className="btn-primary"
            style={{ width: "100%", marginBottom: "12px" }}
          >
            Contact Ernest
          </a>
          <button
            className="body-md btn-secondary"
            onClick={onSleep}
            style={{ width: "100%" }}
          >
            Let Librarian Sleep
          </button>
        </div>
      </nav>

      {/* Right Pane: Content Tabs */}
      <main className="content-pane-dynamic">
        <div className="tabs-header" role="tablist" aria-label="Resume sections">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`tab-btn headline-sm ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="tab-content-area card-elevated" role="tabpanel" aria-label={activeTab}>
          {isLoading ? (
            /* Dreaming / loading state */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
                gap: "16px",
              }}
            >
              <p className="headline-sm pulse" style={{ color: "var(--on-surface-variant)" }}>
                {dreamState}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <h2 className="display-sm" style={{ margin: 0 }}>
                  {expandedContent ? "Expanded Section" : activeTab}
                </h2>
                {expandedContent && (
                  <button
                    onClick={() => setExpandedContent(null)}
                    className="btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "0.875rem" }}
                  >
                    ← Back to {activeTab}
                  </button>
                )}
              </div>
              <div className="body-md" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {expandedContent ? (
                  /* Show expanded section content with markdown formatting */
                  <MarkdownContent content={expandedContent} />
                ) : displayContent ? (
                  /* Agent-generated markdown content rendered with proper formatting */
                  <MarkdownContent content={displayContent} />
                ) : (
                  /* Static fallback from resume.ts */
                  <StaticContent tab={activeTab} />
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Librarian Chat Panel */}
      <LibrarianChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onTabRequest={handleChatTabRequest}
        onExpandedContent={handleExpandedContent}
      />

      {/* Floating Chat Button (lower right corner) */}
      {!isChatOpen && (
        <button
          className="floating-chat-btn"
          onClick={() => setIsChatOpen(true)}
          aria-label="Open chat with librarian"
          title="Ask the Librarian"
        >
          <span className="chat-icon">💬</span>
          <span className="chat-label">Ask</span>
        </button>
      )}
    </div>
  );
}
