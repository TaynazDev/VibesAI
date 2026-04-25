import { useCriticScores } from "../store/AppContext";
import type { CriticScore } from "../store/AppContext";

interface Props {
  projectId: string;
  onClose: () => void;
}

export function ReleaseReadinessModal({ projectId, onClose }: Props) {
  const criticScores = useCriticScores();

  const latestScore = criticScores
    .filter((s: CriticScore) => s.projectId === projectId)
    .sort((a: CriticScore, b: CriticScore) => b.timestamp - a.timestamp)[0];

  if (!latestScore) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box glass" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">📊 Release Readiness</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <p style={{ textAlign: "center", color: "var(--ink-muted)" }}>
              No critic scores available yet. Run an AI Critic Pass to get release readiness metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const readinessChecks = [
    {
      name: "UX Score",
      value: latestScore.uxScore,
      status: latestScore.uxScore >= 75 ? "done" : "pending",
      hint: `${latestScore.uxScore} / 100`,
    },
    {
      name: "A11y Score",
      value: latestScore.a11yScore,
      status: latestScore.a11yScore >= 75 ? "done" : "pending",
      hint: `${latestScore.a11yScore} / 100`,
    },
    {
      name: "Performance",
      value: latestScore.perfScore,
      status: latestScore.perfScore >= 75 ? "done" : "pending",
      hint: `${latestScore.perfScore} / 100`,
    },
    {
      name: "Critical Issues",
      value: latestScore.issues.filter((i: any) => i.severity === "critical").length === 0 ? 100 : 0,
      status: latestScore.issues.filter((i: any) => i.severity === "critical").length === 0 ? "done" : "pending",
      hint: `${latestScore.issues.filter((i: any) => i.severity === "critical").length} critical issues`,
    },
  ];

  const overallScore = Math.round((latestScore.uxScore + latestScore.a11yScore + latestScore.perfScore) / 3);
  const isReady = overallScore >= 75 && latestScore.issues.filter((i: any) => i.severity === "critical").length === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box glass" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📊 Release Readiness</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Overall Readiness Score */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--glass-stroke)",
            borderRadius: "var(--radius-md)",
            padding: "1.2rem",
            textAlign: "center",
            marginBottom: "1rem",
          }}>
            <div style={{
              fontSize: "2.4rem",
              fontWeight: 700,
              background: `linear-gradient(135deg, ${isReady ? "#10b981" : overallScore >= 60 ? "#f59e0b" : "#ef4444"}, ${isReady ? "#34d399" : overallScore >= 60 ? "#fbbf24" : "#f87171"})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.5rem",
            }}>
              {overallScore}%
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {isReady ? "✅ Ready to Release" : overallScore >= 60 ? "⚠️ Review Needed" : "❌ Not Ready"}
            </div>
          </div>

          {/* Readiness Checks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Checks</h3>
            {readinessChecks.map((check, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 0.85rem",
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--glass-stroke)`,
              }}>
                <div style={{ fontSize: "1rem" }}>
                  {check.status === "done" ? "✅" : "❌"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{check.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{check.hint}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Issues */}
          {latestScore.issues.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Issues</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {latestScore.issues.slice(0, 3).map((issue: any, i: number) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: "0.5rem",
                    fontSize: "0.82rem",
                    padding: "0.5rem",
                    background: "var(--surface)",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: `3px solid ${issue.severity === "critical" ? "#ef4444" : issue.severity === "warning" ? "#f59e0b" : "#3b82f6"}`,
                  }}>
                    <span style={{ fontWeight: 600, minWidth: "50px" }}>
                      {issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟡" : "🔵"} {issue.severity}
                    </span>
                    <span style={{ flex: 1 }}>{issue.message}</span>
                  </div>
                ))}
                {latestScore.issues.length > 3 && (
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", padding: "0.25rem 0.5rem" }}>
                    +{latestScore.issues.length - 3} more issues
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button className="text-button" onClick={onClose}>Close</button>
            <button className="run-button" onClick={onClose} style={{ opacity: isReady ? 1 : 0.6 }}>
              {isReady ? "🚀 Deploy" : "📋 Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
