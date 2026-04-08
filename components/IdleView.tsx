"use client";

import { useState, useEffect } from "react";

const dreamingStates = [
  "Ruminating on pedagogy...",
  "Indexing deep learning models...",
  "Dreaming of perfect prompt structures...",
  "Organizing vector databases...",
  "Synthesizing historical data...",
  "Simulating coaching sessions...",
];

interface IdleViewProps {
  onWakeUp: () => void;
}

export default function IdleView({ onWakeUp }: IdleViewProps) {
  const [dreamState, setDreamState] = useState(dreamingStates[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDreamState(
        dreamingStates[Math.floor(Math.random() * dreamingStates.length)]
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="idle-view-container"
      role="button"
      tabIndex={0}
      onClick={onWakeUp}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onWakeUp();
      }}
      aria-label="Wake the librarian — press Enter or Space"
      style={{ backgroundImage: "url(/sleepy-librarian.png)", backgroundColor: "#fcf8f9" }}
    >
      <div
        className="glass-panel"
        style={{ padding: "1rem 2rem", borderRadius: "2rem", marginTop: "2rem" }}
      >
        <h2 className="headline-sm" style={{ margin: 0, color: "var(--on-background)" }}>
          {dreamState}
        </h2>
      </div>

      <div className="pulse" style={{ marginBottom: "2rem" }}>
        <p
          className="label-md"
          style={{
            background: "var(--surface-container-low)",
            padding: "0.5rem 1.5rem",
            borderRadius: "1rem",
          }}
        >
          Click anywhere to wake up
        </p>
      </div>
    </div>
  );
}
