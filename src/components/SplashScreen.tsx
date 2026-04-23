import { useState } from "react";
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
        aria-label="Enter VibesAI"
      >
        <img src={logo} alt="VibesAI" className="splash-logo" />
      </button>
      <p className="splash-hint">tap to enter</p>
    </div>
  );
}
