import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications, useSettings } from "../store/AppContext";

const ITEMS = [
  { label: "AI Chat",       to: "/ai-chat",       icon: "✧" },
  { label: "Library",       to: "/library",       icon: "⚡" },
  { label: "Projects",      to: "/projects",      icon: "◫" },
  { label: "Analytics",     to: "/analytics",     icon: "📊" },
  { label: "Alerts",        to: "/notifications", icon: "◉" },
  { label: "Home",          to: "/",              icon: "⌂" },
  { label: "Soon",          to: "/coming-soon",   icon: "✦" },
  { label: "Settings",      to: "/settings",      icon: "⚙" },
  { label: "Account",       to: "/account",       icon: "◌" },
];

const ITEM_GAP = 110;   // px between circle centres
const ARC_PULL = 32;    // max px the inactive items pull back left
const ARC_STEP = 20;    // degrees per step
const WHEEL_SPEED = 0.5;

function isRouteActive(to: string, pathname: string): boolean {
  if (to === "/") {
    return pathname === "/" || pathname.startsWith("/builder/") || pathname.startsWith("/edit/");
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

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

  const activeIndex = useMemo(
    () => Math.max(0, ITEMS.findIndex((it) => isRouteActive(it.to, pathname))),
    [pathname]
  );
  const [scrollOffset, setScrollOffset] = useState(activeIndex * ITEM_GAP);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragPointerIdRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setScrollOffset(activeIndex * ITEM_GAP);
  }, [activeIndex]);

  const maxIndex = ITEMS.length - 1;
  const maxOffset = maxIndex * ITEM_GAP;
  const clampedOffset = Math.max(0, Math.min(scrollOffset, maxOffset));

  const stopDragging = () => {
    dragPointerIdRef.current = null;
    setIsDragging(false);
    if (suppressClickRef.current) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const applyDragDelta = (currentY: number) => {
    const deltaY = currentY - dragStartYRef.current;
    if (Math.abs(deltaY) > 6) {
      suppressClickRef.current = true;
    }
    const nextOffset = Math.max(0, Math.min(dragStartOffsetRef.current - deltaY, maxOffset));
    setScrollOffset(nextOffset);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (event: MouseEvent) => {
      applyDragDelta(event.clientY);
    };

    const onMouseUp = () => {
      stopDragging();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, maxOffset]);

  return (
    <>
      {/* Items float freely along the arc — no background panel */}
      <nav
        className={`dial-layer${isDragging ? " dragging" : ""}`}
        aria-label="Primary navigation"
        onMouseDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          dragStartYRef.current = event.clientY;
          dragStartOffsetRef.current = clampedOffset;
          suppressClickRef.current = false;
          setIsDragging(true);
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          dragPointerIdRef.current = event.pointerId;
          dragStartYRef.current = event.clientY;
          dragStartOffsetRef.current = clampedOffset;
          suppressClickRef.current = false;
          setIsDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragPointerIdRef.current !== event.pointerId) return;
          applyDragDelta(event.clientY);
        }}
        onPointerUp={(event) => {
          if (dragPointerIdRef.current !== event.pointerId) return;
          stopDragging();
        }}
        onPointerCancel={(event) => {
          if (dragPointerIdRef.current !== event.pointerId) return;
          stopDragging();
        }}
        onWheel={(event) => {
          event.preventDefault();
          if (event.deltaY === 0) return;
          const nextOffset = Math.max(0, Math.min(clampedOffset + event.deltaY * WHEEL_SPEED, maxOffset));
          setScrollOffset(nextOffset);
        }}
      >
        {ITEMS.map((item, i) => {
          const yOffset = i * ITEM_GAP - clampedOffset;
          const offset = yOffset / ITEM_GAP;
          const angleRad = offset * ARC_STEP * (Math.PI / 180);
          const xPull = ARC_PULL * (1 - Math.cos(angleRad));
          const isActive = isRouteActive(item.to, pathname);
          const opacity = isActive ? 1 : Math.max(0.68, Math.cos(Math.abs(offset) * 18 * (Math.PI / 180)));
          const isNotif = item.to === "/notifications" && unreadCount > 0;

          return (
            <button
              key={item.to}
              className={`dial-btn${isActive ? " active" : ""}`}
              style={{
                transform: `translate(${-xPull}px, calc(-50% + ${yOffset}px))`,
                opacity,
                transition: isDragging ? "none" : undefined,
              }}
              onClick={() => {
                if (suppressClickRef.current) {
                  return;
                }
                setScrollOffset(i * ITEM_GAP);
                if (item.to === "/" && pathname === "/") {
                  navigate("/", { state: { fresh: Date.now() }, replace: false });
                } else {
                  navigate(item.to);
                }
              }}
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

