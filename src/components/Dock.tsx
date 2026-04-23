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

// Gap in px between item centers along the dial
const ITEM_GAP = 60;
// Max px an item pulls back (leftward) from the active position's x
const ARC_PULL = 26;
// Degrees per step for computing the cosine x-pull
const ARC_STEP = 22;

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
          const angleRad = offset * ARC_STEP * (Math.PI / 180);
          // How much this item is pulled back from the rightmost (active) point
          const xPull = ARC_PULL * (1 - Math.cos(angleRad));
          // Vertical offset from center
          const yOffset = offset * ITEM_GAP;
          const isActive = i === activeIndex;
          // Fade out items farther from center
          const opacity = isActive
            ? 1
            : Math.max(0.3, Math.cos(Math.abs(offset) * 28 * (Math.PI / 180)));
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
