import { NavLink } from "react-router-dom";
import { PrismSuiteLogo, VibesAiLogo } from "./BrandLogo";
import { useNotifications } from "../store/AppContext";

type DockItem = {
  label: string;
  to: string;
  icon: string;
};

const items: DockItem[] = [
  { label: "Home", to: "/", icon: "◎" },
  { label: "Projects", to: "/projects", icon: "▦" },
  { label: "Alerts", to: "/notifications", icon: "◉" },
  { label: "Settings", to: "/settings", icon: "◌" },
  { label: "Account", to: "/account", icon: "◍" }
];

export function Dock() {
  const { unreadCount } = useNotifications();

  return (
    <aside className="dock glass" aria-label="Primary navigation">
      <div className="dock-brand">
        <VibesAiLogo className="vibes-logo" />
        <div>
          <div className="brand-main">VibesAI</div>
          <div className="brand-sub">Prism Suite</div>
        </div>
      </div>
      <div className="suite-lockup">
        <PrismSuiteLogo className="prism-logo" />
      </div>
      <nav>
        <ul className="dock-list">
          {items.map((item) => (
            <li key={item.to} className="dock-link-wrap">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "dock-link active" : "dock-link"
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
              {item.to === "/notifications" && unreadCount > 0 && (
                <span className="nav-badge" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
