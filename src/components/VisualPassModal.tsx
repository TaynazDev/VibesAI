import { useState } from "react";
import type { ProjectBuilderState } from "../data/mock";

interface Props {
  projectId: string;
  builder: ProjectBuilderState | undefined;
  onClose: () => void;
}

export function VisualPassModal({ builder, onClose }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);

  const runVisualPass = async () => {
    if (!builder?.generatedCode) return;
    setIsRunning(true);

    // Simulate AI visual polish analysis
    // In production, call an AI endpoint with the generated code
    setTimeout(() => {
      const visualSuggestions = {
        timestamp: Date.now(),
        suggestions: [
          {
            category: "Spacing & Rhythm",
            severity: "warning",
            suggestion: "Increase padding on cards from 12px to 16px for better breathing room",
            impact: "Improves visual hierarchy and readability",
            applySample: "padding: 16px;",
          },
          {
            category: "Typography",
            severity: "info",
            suggestion: "Increase line-height from 1.4 to 1.6 for body text to improve legibility",
            impact: "Enhances readability on all screen sizes",
            applySample: "line-height: 1.6;",
          },
          {
            category: "Color Contrast",
            severity: "info",
            suggestion: "Increase contrast between text and background from 4.2:1 to 5.1:1 WCAG AA",
            impact: "Improves accessibility compliance",
            applySample: "color: #1a1a1a; /* darker text */",
          },
          {
            category: "Shadows & Depth",
            severity: "warning",
            suggestion: "Use consistent shadow depths: replace mixed shadows with semantic scale (sm/md/lg)",
            impact: "Creates visual consistency and polish",
            applySample: "box-shadow: 0 4px 16px rgba(0,0,0,0.12);",
          },
          {
            category: "Border Radius",
            severity: "info",
            suggestion: "Standardize border radius: use 8px for inputs, 12px for cards, 999px for pills",
            impact: "Creates cohesive design language",
            applySample: "border-radius: 8px;",
          },
          {
            category: "Animations",
            severity: "warning",
            suggestion: "Add micro-interactions: subtle fade-in on page load, smooth transitions on hover",
            impact: "Improves perceived responsiveness",
            applySample: "transition: all 200ms ease;",
          },
        ],
        overallScore: 78,
        scoreBreakdown: {
          spacing: 72,
          typography: 85,
          contrast: 88,
          consistency: 70,
          animation: 65,
        },
      };

      setSuggestions(visualSuggestions);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box glass" onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h2 className="modal-title">✨ Visual Polish Pass</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!suggestions ? (
          <div className="modal-body">
            <p>Get AI-powered suggestions to polish your app's visual design, spacing, typography, and micro-interactions.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem" }}>📐</div>
                <div>
                  <strong style={{ display: "block" }}>Spacing & Layout</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    Optimize padding, margins, and visual hierarchy
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem" }}>🎨</div>
                <div>
                  <strong style={{ display: "block" }}>Color & Contrast</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    Improve readability and WCAG accessibility standards
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem" }}>✍️</div>
                <div>
                  <strong style={{ display: "block" }}>Typography</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    Refine font sizes, weights, and line heights
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem" }}>⚡</div>
                <div>
                  <strong style={{ display: "block" }}>Micro-interactions</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    Add polish with subtle animations and transitions
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="run-button"
                onClick={runVisualPass}
                disabled={isRunning}
                style={{ flex: 1 }}
              >
                {isRunning ? "⏳ Analyzing..." : "✨ Run Visual Pass"}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--accent)" }}>
                  {suggestions.overallScore}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: "0.25rem", color: "var(--ink-soft)" }}>
                  Polish Score
                </div>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--success)" }}>
                  {suggestions.suggestions.length}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: "0.25rem", color: "var(--ink-soft)" }}>
                  Suggestions
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Category Breakdown
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {Object.entries(suggestions.scoreBreakdown).map(([category, score]: [string, any]) => (
                  <div key={category} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ textTransform: "capitalize", fontWeight: 500 }}>{category}</div>
                      <div style={{
                        height: "4px",
                        background: "var(--surface)",
                        borderRadius: "999px",
                        overflow: "hidden",
                        marginTop: "0.25rem",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${score}%`,
                          background: score >= 80 ? "var(--success)" : score >= 70 ? "#f59e0b" : "#ef4444",
                          transition: "width 300ms ease",
                        }} />
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, minWidth: "30px", textAlign: "right" }}>{score}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Suggestions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {suggestions.suggestions.map((s: any, i: number) => (
                  <div key={i} style={{
                    background: "var(--surface)",
                    border: "1px solid var(--glass-stroke)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{s.category}</div>
                      <span style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                        background: s.severity === "warning" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                        color: s.severity === "warning" ? "#f59e0b" : "#3b82f6",
                      }}>
                        {s.severity}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-main)" }}>{s.suggestion}</p>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                      💡 {s.impact}
                    </p>
                    <code style={{
                      background: "rgba(0,0,0,0.2)",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      overflow: "auto",
                    }}>
                      {s.applySample}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="text-button" onClick={onClose}>Close</button>
              <button className="run-button" onClick={() => setSuggestions(null)}>Run Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
