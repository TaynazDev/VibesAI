import { useState } from "react";
import { useAppDispatch } from "../store/AppContext";
import type { ProjectBuilderState } from "../data/mock";

interface Props {
  projectId: string;
  builder: ProjectBuilderState | undefined;
  onClose: () => void;
}

function getCriticGrade(score: number): "great" | "good" | "fair" | "poor" {
  if (score >= 85) return "great";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

export function AICriticPassModal({ projectId, builder, onClose }: Props) {
  const dispatch = useAppDispatch();
  const [isRunning, setIsRunning] = useState(false);
  const [criticism, setCriticism] = useState<any>(null);

  const runCriticPass = async () => {
    if (!builder) return;
    setIsRunning(true);

    // Simulate AI critic analysis
    // In production, this would call an API endpoint
    setTimeout(() => {
      const score = {
        uxScore: 78,
        a11yScore: 82,
        perfScore: 88,
        overallScore: (78 + 82 + 88) / 3,
        issues: [
          {
            category: "UX",
            severity: "warning" as const,
            message: "Consider adding loading states for async operations",
          },
          {
            category: "Accessibility",
            severity: "info" as const,
            message: "All interactive elements have proper ARIA labels",
          },
          {
            category: "Performance",
            severity: "warning" as const,
            message: "Image optimization could reduce bundle size by ~5%",
          },
          {
            category: "UX",
            severity: "info" as const,
            message: "Responsive design is well-implemented across breakpoints",
          },
        ],
      };

      setCriticism(score);
      dispatch({
        type: "CRITIC_SCORE_ADD",
        projectId,
        score: {
          projectId,
          timestamp: Date.now(),
          ...score,
        },
      });

      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🤖 AI Critic Pass</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {!criticism ? (
          <div className="modal-body">
            <p>Run an AI analysis on your design to get scores for UX, accessibility, and performance.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem" }}>📱</div>
                <div>
                  <strong style={{ display: "block" }}>UX Analysis</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    Evaluates user experience and interaction patterns
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem" }}>♿</div>
                <div>
                  <strong style={{ display: "block" }}>Accessibility</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    Checks WCAG compliance and a11y best practices
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.5rem" }}>⚡</div>
                <div>
                  <strong style={{ display: "block" }}>Performance</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    Analyzes load time and rendering efficiency
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="run-button"
                onClick={runCriticPass}
                disabled={isRunning}
                style={{ flex: 1 }}
              >
                {isRunning ? "⏳ Analyzing..." : "🎯 Run Critic Pass"}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: `${getCriticGrade(criticism.uxScore) === "great" ? "var(--success)" : getCriticGrade(criticism.uxScore) === "good" ? "#f59e0b" : "#ef4444"}` }}>
                  {criticism.uxScore}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: "0.25rem", color: "var(--ink-soft)" }}>UX</div>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: `${getCriticGrade(criticism.a11yScore) === "great" ? "var(--success)" : getCriticGrade(criticism.a11yScore) === "good" ? "#f59e0b" : "#ef4444"}` }}>
                  {criticism.a11yScore}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: "0.25rem", color: "var(--ink-soft)" }}>A11y</div>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: `${getCriticGrade(criticism.perfScore) === "great" ? "var(--success)" : getCriticGrade(criticism.perfScore) === "good" ? "#f59e0b" : "#ef4444"}` }}>
                  {criticism.perfScore}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: "0.25rem", color: "var(--ink-soft)" }}>Perf</div>
              </div>
              <div style={{ background: "var(--dock-active-bg)", borderRadius: "var(--radius-md)", padding: "0.75rem", textAlign: "center", border: "1px solid var(--dock-active-border)" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--dock-active-color)" }}>
                  {Math.round(criticism.overallScore)}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, marginTop: "0.25rem", color: "var(--ink-soft)" }}>Overall</div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Issues Found</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {criticism.issues.slice(0, 3).map((issue: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.82rem", padding: "0.5rem", background: "var(--surface)", borderRadius: "var(--radius-sm)", borderLeft: `3px solid ${issue.severity === "critical" ? "#ef4444" : issue.severity === "warning" ? "#f59e0b" : "#3b82f6"}` }}>
                    <span style={{ fontWeight: 600, minWidth: "50px" }}>
                      {issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "🔵"} {issue.severity}
                    </span>
                    <span style={{ flex: 1 }}>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="text-button" onClick={onClose}>Close</button>
              <button className="run-button" onClick={() => setCriticism(null)}>Run Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
