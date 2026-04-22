import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useNotifications } from "../../store/AppContext";

export function NotificationsPage() {
  const { notifications, unreadCount } = useNotifications();
  const dispatch = useAppDispatch();

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Notifications</h1>
        <p>Every AI run, sync, and system alert shows up here.</p>
      </header>

      {unreadCount > 0 && (
        <GlassPanel>
          <div className="inline-controls" style={{ justifyContent: "space-between" }}>
            <span>
              {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => dispatch({ type: "NOTIFICATION_MARK_ALL_READ" })}
            >
              Mark all as read
            </button>
          </div>
        </GlassPanel>
      )}

      <GlassPanel>
        {notifications.length === 0 ? (
          <p className="empty-state">No notifications yet. Run a prompt to get started.</p>
        ) : (
          <ul className="list-grid" aria-label="Notifications">
            {notifications.map((n) => (
              <li key={n.id} className={`list-item${n.unread ? " unread-item" : ""}`}>
                <div>
                  <strong>{n.title}</strong>
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
