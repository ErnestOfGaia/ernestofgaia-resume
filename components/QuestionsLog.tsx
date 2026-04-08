"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  timestamp: string;
  question: string;
  detectedSection?: "Historical" | "Skills Based" | "Passions" | null;
  detectedTopic?: string;
  responseType: "tab" | "expanded" | "custom";
}

const CORRECT_USERNAME = "E0G";
const CORRECT_PASSWORD = "E0G";

function LoginGate({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
      onLogin();
    } else {
      setError("Invalid credentials");
      setPassword("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "24px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h3 className="headline-sm" style={{ marginBottom: "8px" }}>
          Questions Log
        </h3>
        <p className="label-md" style={{ color: "var(--on-surface-variant)" }}>
          Secure access required
        </p>
      </div>

      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: "300px",
        }}
      >
        <div>
          <label className="label-md" style={{ display: "block", marginBottom: "6px" }}>
            Username
          </label>
          <input
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="label-md" style={{ display: "block", marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p style={{ color: "var(--error)", margin: "0", fontSize: "0.875rem" }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" style={{ width: "100%" }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default function QuestionsLog() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [questions, setQuestions] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "topic">("recent");
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [filterSection, setFilterSection] = useState<string>("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/log-question");
      const data = await res.json();
      setQuestions(data.logs || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestion = async (timestamp: string) => {
    if (!confirm("Remove this question? This cannot be undone.")) return;

    try {
      const res = await fetch("/api/log-question/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp }),
      });

      if (res.ok) {
        // Remove from local state
        setQuestions((prev) => prev.filter((q) => q.timestamp !== timestamp));
      } else {
        alert("Failed to delete question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Error deleting question");
    }
  };

  const getUniqueTopics = () => {
    const topics = new Set<string>();
    questions.forEach((q) => {
      if (q.detectedTopic) topics.add(q.detectedTopic);
    });
    return Array.from(topics).sort();
  };

  const getSections = () => {
    const sections = new Set<string>();
    questions.forEach((q) => {
      if (q.detectedSection) sections.add(q.detectedSection);
    });
    return Array.from(sections);
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterTopic && q.detectedTopic !== filterTopic) return false;
    if (filterSection && q.detectedSection !== filterSection) return false;
    return true;
  });

  const sortedQuestions =
    sortBy === "recent"
      ? [...filteredQuestions].reverse()
      : [...filteredQuestions].sort((a, b) => {
          const topicA = a.detectedTopic || "";
          const topicB = b.detectedTopic || "";
          return topicA.localeCompare(topicB);
        });

  if (!isAuthenticated) {
    return <LoginGate onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Stats */}
      <div>
        <h3 className="headline-sm" style={{ marginBottom: "8px" }}>
          Questions Log
        </h3>
        <p className="label-md" style={{ color: "var(--on-surface-variant)" }}>
          Total questions: {questions.length} | Showing: {filteredQuestions.length}
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "16px",
          backgroundColor: "var(--surface-container-low)",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label className="label-md" style={{ margin: 0 }}>
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recent" | "topic")}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-lowest)",
                color: "var(--on-background)",
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="topic">By Topic</option>
            </select>
          </div>

          {/* Filter by Topic */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label className="label-md" style={{ margin: 0 }}>
              Topic:
            </label>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-lowest)",
                color: "var(--on-background)",
              }}
            >
              <option value="">All topics</option>
              {getUniqueTopics().map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label className="label-md" style={{ margin: 0 }}>
              Section:
            </label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid var(--outline-variant)",
                backgroundColor: "var(--surface-container-lowest)",
                color: "var(--on-background)",
              }}
            >
              <option value="">All sections</option>
              {getSections().map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchQuestions}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.875rem" }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <p style={{ color: "var(--on-surface-variant)", textAlign: "center" }}>
          Loading questions...
        </p>
      ) : sortedQuestions.length === 0 ? (
        <p style={{ color: "var(--on-surface-variant)", textAlign: "center" }}>
          No questions logged yet. They'll appear here as visitors ask the librarian!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {sortedQuestions.map((q, idx) => (
            <div
              key={idx}
              style={{
                padding: "16px",
                backgroundColor: "var(--surface-container-low)",
                borderRadius: "8px",
                borderLeft: "4px solid var(--primary)",
              }}
            >
              {/* Question */}
              <p
                className="body-md"
                style={{
                  fontWeight: 500,
                  marginBottom: "12px",
                  color: "var(--on-background)",
                }}
              >
                "{q.question}"
              </p>

              {/* Metadata */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                  alignItems: "center",
                }}
              >
                {/* Time */}
                <span className="label-md" style={{ color: "var(--on-surface-variant)" }}>
                  📅 {new Date(q.timestamp).toLocaleDateString()} {new Date(q.timestamp).toLocaleTimeString()}
                </span>

                {/* Section */}
                {q.detectedSection && (
                  <span
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "var(--primary)",
                      color: "var(--on-primary)",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {q.detectedSection}
                  </span>
                )}

                {/* Topic */}
                {q.detectedTopic && (
                  <span
                    style={{
                      padding: "4px 12px",
                      backgroundColor: "var(--secondary-container)",
                      color: "var(--on-secondary-container)",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    🏷️ {q.detectedTopic}
                  </span>
                )}

                {/* Response Type */}
                <span
                  className="label-md"
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "var(--surface-container-highest)",
                    borderRadius: "4px",
                  }}
                >
                  {q.responseType === "tab" && "📋 Tab View"}
                  {q.responseType === "expanded" && "🔍 Expanded View"}
                  {q.responseType === "custom" && "💬 Custom Answer"}
                </span>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteQuestion(q.timestamp)}
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  backgroundColor: "var(--error)",
                  color: "white",
                }}
              >
                🗑️ Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "var(--surface-container-low)",
          borderRadius: "8px",
          fontSize: "0.8rem",
          color: "var(--on-surface-variant)",
        }}
      >
        <p style={{ margin: "0 0 8px 0", fontWeight: 500 }}>Legend:</p>
        <ul style={{ margin: "0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <li>📋 Tab View = User clicked a pre-generated button</li>
          <li>🔍 Expanded View = User asked for details about a specific topic</li>
          <li>💬 Custom Answer = User typed a general question</li>
        </ul>
      </div>
    </div>
  );
}
