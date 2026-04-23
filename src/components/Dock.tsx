import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications, useSettings } from "../store/AppContext";

const ITEMS = [
  { label: "Home",          to: "/",              icon: "⌂" },
  { label: "Projects",      to: "/projects",      icon: "◫" },
  { label: "Alerts",        to: "/notifications", icon: "◉" },
  { label: "Settings",      to: "/settings",      icon: "⚙" },
  { label: "Account",       to: "/account",       icon: "◌" },
];

// Radius of the arc circle (matches the glass pill radius)
const R = 125;
// Equal vertical gap between item centers
const ITEM_GAP = 56;
// Angle step derived so arc y-spacing ≈ ITEM_GAP (arcsin(56/125) ≈ 27°)
const THETA_STEP = 27 * (Math.PI / 180);

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
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount } = useNotifications();
  const { theme } = useSettings();
  const isDark = useIsDark(theme);

  const activeIndex = Math.max(
    0,
    ITEMS.findIndex((it) => it.to === pathname)
  );

  const themeIcon = isDark ? "☽" : "☀";

  return (
    <>
      {/* Glass arc pill — pushed left so only the right curved edge is visible */}
      <div className="dial-arc-bg glass" aria-hidden="true" />

      {/* Nav items positioned along the arc */}
      <nav className="dial-items-layer" aria-label="Primary navigation">
        {ITEMS.map((item, i) => {
          const offset = i - activeIndex;
          const theta = offset * THETA_STEP;
          // True circular-arc: item sits on the circumference of the R=125 circle
          const xPull = Math.round(R * (1 - Math.cos(theta)));
          const yOffset = offset * ITEM_GAP;
          const isActive = i === activeIndex;
          // Fade items farther from center
          const opacity = isActive
            ? 1
            : Math.max(0.28, Math.cos(Math.abs(offset) * 32 * (Math.PI / 180)));
          const isNotif = item.to === "/notifications" && unreadCount > 0;

          return (
            <button
              key={item.to}
              className={`dial-item${isActive ? " active" : ""}`}
              style={{
                transform: `translate(${-xPull}px, ${yOffset - 22}px)`,
                opacity,
              }}
              onClick={() => navigate(item.to)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
            >
              <span aria-hidden="true">{item.icon}</span>
              {isNotif && (
                <span className="dial-badge" aria-label="Unread notifications" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme indicator */}
      <div
        className="dial-theme-icon"
        title={isDark ? "Dark mode" : "Light mode"}
        aria-hidden="true"
      >
        {themeIcon}
      </div>
    </>
  );
}
