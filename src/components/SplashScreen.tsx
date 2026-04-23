import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useSettings } from "../store/AppContext";

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const { theme } = useSettings();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const logo = isDark
    ? "/branding/vibesai-logo-dark.jpg"
    : "/branding/vibesai-logo-light.jpg";

  const [phase, setPhase] = useState<"idle" | "pressed" | "fading">("idle");
  const [shadowOffset, setShadowOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return;
    }

    let frame = 0;
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const gamma = clamp(event.gamma ?? 0, -18, 18);
      const beta = clamp(event.beta ?? 0, -18, 18);
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setShadowOffset({
          x: Number((gamma * 0.35).toFixed(2)),
          y: Number((beta * 0.22).toFixed(2)),
        });
      });
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  const splashButtonStyle = useMemo(() => ({
    "--splash-shadow-x": `${shadowOffset.x}px`,
    "--splash-shadow-y": `${shadowOffset.y}px`,
  }) as CSSProperties, [shadowOffset.x, shadowOffset.y]);

  const handleClick = () => {
    if (phase !== "idle") return;
    setPhase("pressed");
    setTimeout(() => setPhase("fading"), 200);
    setTimeout(() => onDone(), 720);
  };

  return (
    <div className="splash-root" data-theme={theme} data-phase={phase}>
      <div className="splash-atmosphere" aria-hidden="true" />
      <button
        className="splash-btn"
        onClick={handleClick}
        style={splashButtonStyle}
        aria-label="Enter VibesAI"
      >
        <img src={logo} alt="VibesAI" className="splash-logo" />
      </button>
      <p className="splash-hint">tap to enter</p>
    </div>
  );
}
