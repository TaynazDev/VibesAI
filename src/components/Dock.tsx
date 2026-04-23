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

const ITEM_GAP = 110;   // px between circle centres
const ARC_PULL = 32;    // max px the inactive items pull back left
const ARC_STEP = 20;    // degrees per step

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

  const activeIndex = Math.max(0, ITEMS.findIndex((it) => it.to === pathname));

  return (
    <>
      {/* Items float freely along the arc — no background panel */}
      <nav className="dial-layer" aria-label="Primary navigation">
        {ITEMS.map((item, i) => {
          const offset = i - activeIndex;
          const angleRad = offset * ARC_STEP * (Math.PI / 180);
          const xPull = ARC_PULL * (1 - Math.cos(angleRad));
          const yOffset = offset * ITEM_GAP;
          const isActive = i === activeIndex;
          const opacity = isActive ? 1 : Math.max(0.35, Math.cos(Math.abs(offset) * 26 * (Math.PI / 180)));
          const isNotif = item.to === "/notifications" && unreadCount > 0;

          return (
            <button
              key={item.to}
              className={`dial-btn${isActive ? " active" : ""}`}
              style={{ transform: `translate(${-xPull}px, calc(-50% + ${yOffset}px))`, opacity }}
              onClick={() => navigate(item.to)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
            >
              <span aria-hidden="true">{item.icon}</span>
              {isNotif && <span className="dial-badge" aria-label="Unread" />}
            </button>
          );
        })}
      </nav>

      <div className="dial-theme-icon" aria-hidden="true">
        {isDark ? "☽" : "☀"}
      </div>
    </>
  );
}

