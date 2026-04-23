import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useNotifications, useSettings } from "../store/AppContext";

const ITEMS = [
  { label: "Home",          to: "/",              icon: "⌂" },
  { label: "Projects",      to: "/projects",      icon: "◫" },
  { label: "Alerts",        to: "/notifications", icon: "◉" },
  { label: "Settings",      to: "/settings",      icon: "⚙" },
  { label: "Account",       to: "/account",       icon: "◌" },
];

function useIsDark(theme: "light" | "dark" | "system"): boolean {
  const [sysDark, setSysDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [theme]);
  return theme === "dark" ? true : theme === "light" ? false : sysDark;
}

export function Dock() {
  const { unreadCount } = useNotifications();
  const { theme } = useSettings();
  const isDark = useIsDark(theme);

  return (
    <aside className="dock glass" aria-label="Primary navigation">
      <nav>
        <ul className="dock-list">
          {ITEMS.map((item) => {
            const isNotif = item.to === "/notifications" && unreadCount > 0;
            return (
              <li key={item.to} className="dock-item-wrap">
                <NavLink
                  to={item.to}
                  title={item.label}
                  className={({ isActive }) => isActive ? "dock-btn active" : "dock-btn"}
                  aria-label={item.label}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {isNotif && <span className="dock-badge" aria-label="Unread" />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="dock-theme-icon" aria-hidden="true" title={isDark ? "Dark" : "Light"}>
        {isDark ? "☽" : "☀"}
      </div>
    </aside>
  );
}
