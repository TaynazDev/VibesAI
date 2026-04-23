import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useNotifications, useSettings } from "../store/AppContext";

type DockItem = {
  label: string;
  to: string;
  icon: string;
};

const items: DockItem[] = [
  { label: "Home",      to: "/",             icon: "⌂" },
  { label: "Projects",  to: "/projects",     icon: "◫" },
  { label: "Alerts",    to: "/notifications", icon: "◉" },
  { label: "Settings",  to: "/settings",     icon: "⚙" },
  { label: "Account",   to: "/account",      icon: "◌" },
];

function useIsDark(theme: "light" | "dark" | "system"): boolean {
  const [sysDark, setSysDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  if (theme === "dark") return true;
  if (theme === "light") return false;
  return sysDark;
}

export function Dock() {
  const { unreadCount } = useNotifications();
  const { theme } = useSettings();
  const isDark = useIsDark(theme);

  // Sun for light mode, moon for dark mode
  const themeIcon = isDark ? "☽" : "☀";

  return (
    <aside className="dock glass" aria-label="Primary navigation">
      <div className="dock-brand" aria-hidden="true">
        <span className="dock-monogram">VA</span>
      </div>
      <nav>
        <ul className="dock-list">
          {items.map((item) => (
            <li key={item.to} className="dock-link-wrap">
              <NavLink
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  isActive ? "dock-link active" : "dock-link"
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="dock-link-label">{item.label}</span>
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
      {/* Theme indicator at bottom of dock */}
      <div className="dock-theme-icon" aria-label={`${isDark ? "Dark" : "Light"} mode active`} title={`${isDark ? "Dark" : "Light"} mode`}>
        {themeIcon}
      </div>
    </aside>
  );
}
