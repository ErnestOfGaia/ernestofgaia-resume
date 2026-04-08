"use client";

import { useState, useCallback } from "react";
import { resumeData } from "@/lib/resume";

const tabs = ["Historical", "Skills Based", "Passions"] as const;
type Tab = (typeof tabs)[number];

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

// Static fallback content rendered from resume data (shown before first agent fetch)
function StaticContent({ tab }: { tab: Tab }) {
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
  const [dreamState, setDreamState] = useState(dreamingStates[0]);

  const fetchTabContent = useCallback(async (tab: Tab) => {
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
              <h2 className="display-sm" style={{ marginBottom: "32px" }}>
                {activeTab}
              </h2>
              <div className="body-md" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                {displayContent ? (
                  /* Agent-generated markdown content rendered as plain text for now */
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                    {displayContent}
                  </div>
                ) : (
                  /* Static fallback from resume.ts */
                  <StaticContent tab={activeTab} />
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
