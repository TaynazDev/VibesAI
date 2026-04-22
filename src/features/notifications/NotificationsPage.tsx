import { GlassPanel } from "../../components/GlassPanel";
import { mockNotifications } from "../../data/mock";

export function NotificationsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Notifications</h1>
        <p>In-app center first, with optional device notifications once permissions are approved.</p>
      </header>

      <GlassPanel>
        <ul className="list-grid" aria-label="Notifications list">
          {mockNotifications.map((notification) => (
            <li key={notification.id} className="list-item">
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.detail}</p>
              </div>
              <span className={notification.unread ? "badge" : "badge muted"}>
                {notification.unread ? "Unread" : notification.timestamp}
              </span>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}
