"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "librarian";
  content: string;
}

interface LibrarianChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTabRequest: (tab: "Historical" | "Skills Based" | "Passions") => void;
  onExpandedContent?: (content: string) => void;
}

const AUTO_CLOSE_DELAY = 3000; // 3 seconds

/**
 * Log question to the server for later analysis
 */
async function logQuestion(
  question: string,
  detectedSection?: "Historical" | "Skills Based" | "Passions" | null,
  detectedTopic?: string,
  responseType?: "tab" | "expanded" | "custom"
) {
  try {
    await fetch("/api/log-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        detectedSection: detectedSection || null,
        detectedTopic,
        responseType: responseType || "custom",
      }),
    });
  } catch (error) {
    console.error("Failed to log question:", error);
    // Silently fail - don't disrupt user experience
  }
}

const preGeneratedQueries = [
  {
    label: "📜 Historical Resume",
    query: "Show me my work history organized chronologically",
    tab: "Historical" as const,
  },
  {
    label: "⚙️ Skills Based Resume",
    query: "What are my key technical and professional skills?",
    tab: "Skills Based" as const,
  },
  {
    label: "💡 Passions & Projects",
    query: "Tell me about my passions, projects, and the impact I'm making",
    tab: "Passions" as const,
  },
];

export default function LibrarianChatPanel({
  isOpen,
  onClose,
  onTabRequest,
  onExpandedContent,
}: LibrarianChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePreGeneratedQuery = (
    query: string,
    tab: "Historical" | "Skills Based" | "Passions"
  ) => {
    addMessage("user", query);

    // Log this question
    logQuestion(query, tab, undefined, "tab");

    // Show immediate acknowledgment message
    const acknowledgments: Record<string, string> = {
      "Historical": "Coming right up! Let me gather my work history for you. This gives a chronological view of my professional journey.",
      "Skills Based": "Absolutely! Let me compile my key skills and expertise. This organizes everything by category for easy reference.",
      "Passions": "I'd love to share what drives my work! Here's my philosophy, values, and the bigger picture of what I'm about.",
    };

    addMessage("librarian", acknowledgments[tab]);

    // Then fetch the actual content
    onTabRequest(tab);

    // Auto-close chat after 3 seconds
    setTimeout(() => {
      onClose();
    }, AUTO_CLOSE_DELAY);
  };

  const addMessage = (role: "user" | "librarian", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    addMessage("user", userMessage);
    setInput("");
    setIsLoading(true);

    // Log the question (we'll update section/topic detection below)
    const lowerMessage = userMessage.toLowerCase();
    let tabToRequest: "Historical" | "Skills Based" | "Passions" | null = null;

    // Check if this is a general request for a full resume section
    if (
      lowerMessage.includes("history") ||
      lowerMessage.includes("historical") ||
      (lowerMessage.includes("work") && !lowerMessage.includes("more")) ||
      (lowerMessage.includes("experience") && !lowerMessage.includes("about"))
    ) {
      tabToRequest = "Historical";
    } else if (
      lowerMessage.includes("skill") ||
      lowerMessage.includes("technical") ||
      lowerMessage.includes("expertise") ||
      lowerMessage.includes("tools")
    ) {
      tabToRequest = "Skills Based";
    } else if (
      lowerMessage.includes("passion") ||
      lowerMessage.includes("values") ||
      lowerMessage.includes("philosophy") ||
      lowerMessage.includes("driven") ||
      lowerMessage.includes("stand for")
    ) {
      tabToRequest = "Passions";
    }

    // Detect topic from the question
    let detectedTopic: string | undefined;
    if (lowerMessage.includes("ai")) detectedTopic = "AI";
    else if (lowerMessage.includes("consulting")) detectedTopic = "Consulting";
    else if (lowerMessage.includes("coaching")) detectedTopic = "Coaching";
    else if (lowerMessage.includes("kitchen")) detectedTopic = "Kitchen";
    else if (lowerMessage.includes("relief")) detectedTopic = "Disaster Relief";
    else if (lowerMessage.includes("agriculture") || lowerMessage.includes("farm")) detectedTopic = "Agriculture/Farming";
    else if (lowerMessage.includes("permaculture")) detectedTopic = "Permaculture";
    else if (lowerMessage.includes("educator")) detectedTopic = "Education";
    else if (lowerMessage.includes("python")) detectedTopic = "Python";
    else if (lowerMessage.includes("react") || lowerMessage.includes("typescript") || lowerMessage.includes("next.js")) detectedTopic = "React/TypeScript";
    else if (lowerMessage.includes("skill")) detectedTopic = "Skills";
    else if (lowerMessage.includes("passion") || lowerMessage.includes("philosophy")) detectedTopic = "Philosophy";

    // Check if this is a detailed question about a specific section/role/skill
    const isDetailedQuestion =
      lowerMessage.includes("more about") ||
      lowerMessage.includes("tell me") ||
      lowerMessage.includes("details") ||
      lowerMessage.includes("explain") ||
      lowerMessage.includes("what about") ||
      lowerMessage.includes("describe") ||
      detectedTopic !== undefined;

    // If they asked for a general resume type, trigger that tab
    if (tabToRequest && !isDetailedQuestion) {
      logQuestion(userMessage, tabToRequest, detectedTopic, "tab");
      onTabRequest(tabToRequest);
      addMessage(
        "librarian",
        `Great question! Let me pull up my ${tabToRequest.toLowerCase()} resume for you.`
      );
      setIsLoading(false);

      // Auto-close chat after 3 seconds
      setTimeout(() => {
        onClose();
      }, AUTO_CLOSE_DELAY);

      return;
    }

    // For detailed questions (even if they relate to a section), send to API for expanded details
    // This will provide specific information about the topic they asked about
    logQuestion(userMessage, tabToRequest || null, detectedTopic, "expanded");
    addMessage("librarian", "Let me check the archives...");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();

        // Display the FULL content in the main response window
        if (onExpandedContent) {
          onExpandedContent(data.content);
        }

        // Show only a brief confirmation in the chat
        const briefConfirmations: Record<string, string> = {
          "AI": "Got it! I've pulled together my AI experience for you. Check the response window.",
          "Python": "Perfect! Here's my Python work. See the response window for details.",
          "Consulting": "Right away! My consulting background is ready in the response window.",
          "Coaching": "Absolutely! Check the response window for my coaching experience.",
          "Disaster Relief": "You got it! My disaster relief work is in the response window.",
          "Kitchen": "Sure thing! My kitchen experience is in the response window.",
          "Permaculture": "Great question! My permaculture background is in the response window.",
          "Education": "Of course! My education experience is waiting in the response window.",
          "Skills": "Got it! Here's what I can do — check the response window.",
          "Philosophy": "I'd love to share! My philosophy and values are in the response window.",
        };

        // Find a matching confirmation or use a generic one
        const detectedTopicKey = detectedTopic || userMessage;
        let confirmation = Object.entries(briefConfirmations).find(([key]) =>
          detectedTopicKey.toLowerCase().includes(key.toLowerCase())
        )?.[1];

        if (!confirmation) {
          confirmation = "Got it! Check the response window for the details.";
        }

        // Remove the "thinking" message and replace with brief confirmation
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[updated.length - 1].content === "Let me check the archives...") {
            updated[updated.length - 1] = { role: "librarian", content: confirmation };
          } else {
            updated.push({ role: "librarian", content: confirmation });
          }
          return updated;
        });

        // Auto-close chat after 3 seconds
        setTimeout(() => {
          onClose();
        }, AUTO_CLOSE_DELAY);
      } else {
        const errorData = await res.json().catch(() => ({}));
        addMessage(
          "librarian",
          `I encountered an issue: ${errorData.error || "Could you try rephrasing that?"}`
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage("librarian", "I'm having trouble connecting. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Panel Overlay/Backdrop */}
      {isOpen && (
        <div
          className="chat-panel-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Chat Panel Slide-out */}
      <div className={`librarian-chat-panel ${isOpen ? "open" : "closed"}`}>
        <div className="chat-panel-header">
          <h3 className="headline-sm">Ask the Librarian</h3>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close chat panel"
          >
            ✕
          </button>
        </div>

        <div className="chat-panel-content">
          {/* Pre-generated buttons */}
          {messages.length === 0 && (
            <div className="chat-quick-actions">
              <p className="label-md" style={{ marginBottom: "12px", color: "var(--on-surface-variant)" }}>
                Quick options:
              </p>
              {preGeneratedQueries.map((query) => (
                <button
                  key={query.label}
                  className="quick-action-btn"
                  onClick={() => handlePreGeneratedQuery(query.query, query.tab)}
                  disabled={isLoading}
                >
                  {query.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chat-message chat-message-${msg.role}`}
                >
                  <div className="chat-message-content">
                    {msg.role === "librarian" ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message chat-message-librarian">
                  <div className="chat-message-content">
                    <p style={{ fontStyle: "italic", color: "var(--on-surface-variant)" }}>
                      Consulting the archives...
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="chat-panel-input-area">
          <input
            type="text"
            className="input-field"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
            disabled={isLoading}
          />
          <button
            className="btn-primary"
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            style={{ marginTop: "8px" }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
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

    // Headers
    if (line.startsWith("## ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="headline-sm"
          style={{ marginTop: "16px", marginBottom: "8px" }}
        >
          {line.replace(/^## /, "")}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="display-sm"
          style={{ marginTop: "16px", marginBottom: "12px" }}
        >
          {line.replace(/^# /, "")}
        </h3>
      );
      i++;
      continue;
    }

    // Lists
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        listItems.push(
          <li key={`li-${i}`}>{lines[i].replace(/^[-*] /, "")}</li>
        );
        i++;
      }
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          style={{
            paddingLeft: "1.5rem",
            marginBottom: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
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
            padding: "12px",
            borderRadius: "4px",
            overflow: "auto",
            marginBottom: "12px",
            fontSize: "0.8rem",
          }}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      if (elements.length > 0 && !Array.isArray(elements[elements.length - 1])) {
        elements.push(<div key={`spacer-${i}`} style={{ height: "8px" }} />);
      }
      i++;
      continue;
    }

    // Regular paragraphs with inline formatting
    elements.push(
      <p
        key={`p-${i}`}
        className="body-md"
        style={{ marginBottom: "12px", lineHeight: "1.7" }}
      >
        {parseInlineFormatting(line)}
      </p>
    );
    i++;
  }

  return <div className="markdown-content">{elements}</div>;
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
