import { useAppDispatch, useSnapshots } from "../store/AppContext";

interface Props {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TimeTravelPanel({ projectId, isOpen, onClose }: Props) {
  const dispatch = useAppDispatch();
  const allSnapshots = useSnapshots();

  const snapshots = allSnapshots.filter((s: any) => s.projectId === projectId);

  const restoreSnapshot = (snapshotId: string) => {
    dispatch({
      type: "SNAPSHOT_RESTORE",
      projectId,
      snapshotId,
    });
  };

  const deleteSnapshot = (snapshotId: string) => {
    dispatch({
      type: "SNAPSHOT_DELETE",
      id: snapshotId,
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      right: 0,
      top: 0,
      bottom: 0,
      width: "360px",
      background: "var(--glass-strong)",
      borderLeft: "1px solid var(--glass-stroke)",
      zIndex: 99,
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: "1rem", borderBottom: "1px solid var(--glass-stroke)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>⏱ Time Travel</h2>
        <button style={{ background: "var(--surface)", border: "1px solid var(--glass-stroke)", cursor: "pointer", padding: "0.3rem 0.55rem", borderRadius: "var(--radius-sm)", fontSize: "1rem" }} onClick={onClose}>✕</button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0.75rem" }}>
        {snapshots.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--ink-muted)", padding: "2rem 1rem", fontSize: "0.85rem" }}>
            <p style={{ margin: 0 }}>No snapshots yet. Snapshots are created automatically when you generate code.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {snapshots.map((snapshot: any) => {
              const date = new Date(snapshot.timestamp);
              const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const dateStr = date.toLocaleDateString();
              return (
                <div key={snapshot.id} style={{
                  background: "var(--surface)",
                  border: "1px solid var(--glass-stroke)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {snapshot.label}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.25rem" }}>
                        {dateStr} {timeStr}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", justifyContent: "space-between" }}>
                    <button
                      onClick={() => restoreSnapshot(snapshot.id)}
                      style={{
                        flex: 1,
                        background: "var(--dock-active-bg)",
                        color: "var(--dock-active-color)",
                        border: "1px solid var(--dock-active-border)",
                        padding: "0.4rem 0.6rem",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ↩ Restore
                    </button>
                    <button
                      onClick={() => deleteSnapshot(snapshot.id)}
                      style={{
                        background: "transparent",
                        color: "var(--ink-muted)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: "0.4rem 0.6rem",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
