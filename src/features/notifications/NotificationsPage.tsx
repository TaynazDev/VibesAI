import { useMemo, useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useNotifications } from "../../store/AppContext";

export function NotificationsPage() {
  const { notifications, unreadCount } = useNotifications();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "builder" | "project" | "system">("all");

  const enriched = useMemo(
    () => notifications.map((notification) => ({
      ...notification,
      effectiveKind:
        notification.kind ??
        (notification.title.toLowerCase().includes("plan") || notification.title.toLowerCase().includes("builder")
          ? "builder"
          : notification.title.toLowerCase().includes("complete")
            ? "project"
            : "system"),
    })),
    [notifications]
  );

  const filtered = useMemo(
    () => enriched.filter((notification) => {
      if (filter === "unread" && !notification.unread) return false;
      if (filter !== "all" && filter !== "unread" && notification.effectiveKind !== filter) return false;
      const haystack = `${notification.title} ${notification.detail}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    }),
    [enriched, filter, query]
  );

  const builderCount = enriched.filter((notification) => notification.effectiveKind === "builder").length;
  const projectCount = enriched.filter((notification) => notification.effectiveKind === "project").length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Notifications</h1>
        <p>Every AI run, sync, and system alert shows up here.</p>
      </header>

      <div className="stats-grid">
        <GlassPanel className="stat-panel">
          <span className="stat-label">Unread</span>
          <strong className="stat-value">{unreadCount}</strong>
          <p className="stat-copy">Needs attention right now.</p>
        </GlassPanel>
        <GlassPanel className="stat-panel">
          <span className="stat-label">Builder</span>
          <strong className="stat-value">{builderCount}</strong>
          <p className="stat-copy">Plan + generation updates.</p>
        </GlassPanel>
        <GlassPanel className="stat-panel">
          <span className="stat-label">Project</span>
          <strong className="stat-value">{projectCount}</strong>
          <p className="stat-copy">Per-project AI activity.</p>
        </GlassPanel>
      </div>

      <GlassPanel>
        <div className="notification-toolbar">
          <input
            className="search-input"
            placeholder="Search notifications…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="filter-chips">
            {[
              ["all", "All"],
              ["unread", "Unread"],
              ["builder", "Builder"],
              ["project", "Project"],
              ["system", "System"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? "bar-chip active" : "bar-chip"}
                onClick={() => setFilter(value as typeof filter)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </GlassPanel>

      {unreadCount > 0 && (
        <GlassPanel>
          <div className="inline-controls" style={{ justifyContent: "space-between" }}>
            <span>
              {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
            </span>
            <div className="inline-chip-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => dispatch({ type: "NOTIFICATION_MARK_ALL_READ" })}
              >
                Mark all as read
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => dispatch({ type: "NOTIFICATION_CLEAR_READ" })}
              >
                Clear read items
              </button>
            </div>
          </div>
        </GlassPanel>
      )}

      <GlassPanel>
        {filtered.length === 0 ? (
          <p className="empty-state">No notifications yet. Run a prompt to get started.</p>
        ) : (
          <ul className="list-grid" aria-label="Notifications">
            {filtered.map((n) => (
              <li key={n.id} className={`list-item${n.unread ? " unread-item" : ""}`}>
                <div>
                  <div className="notification-title-row">
                    <strong>{n.title}</strong>
                    <span className={`badge ${n.unread ? "" : "muted"}`}>{n.effectiveKind}</span>
                  </div>
                  <p>{n.detail}</p>
                </div>
                <div className="item-actions">
                  <span className={n.unread ? "badge" : "badge muted"}>
                    {n.unread ? "Unread" : n.timestamp}
                  </span>
                  {n.unread && (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Mark as read"
                      onClick={() =>
                        dispatch({ type: "NOTIFICATION_MARK_READ", id: n.id })
                      }
                    >
                      ✓
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Delete notification"
                    onClick={() => dispatch({ type: "NOTIFICATION_DELETE", id: n.id })}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
