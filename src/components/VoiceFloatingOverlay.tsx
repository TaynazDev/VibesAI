import { useState, useEffect } from "react";
import { VoicePill } from "./VoicePill";

type VoiceFloatingOverlayProps = {
  isListening: boolean;
  isSpeaking: boolean;
  onPillClick: () => void;
  disabled?: boolean;
  frequencies?: number[];
};

export function VoiceFloatingOverlay({
  isListening,
  isSpeaking,
  onPillClick,
  disabled,
  frequencies,
}: VoiceFloatingOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isListening || isSpeaking) {
      setShouldRender(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      // Keep rendered for exit animation, then remove
      const timer = setTimeout(() => setShouldRender(false), 260);
      return () => clearTimeout(timer);
    }
  }, [isListening, isSpeaking]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`voice-floating-overlay${isVisible ? " voice-floating-overlay--visible" : ""}`}>
      <VoicePill
        isListening={isListening}
        isSpeaking={isSpeaking}
        onClick={onPillClick}
        disabled={disabled}
        frequencies={frequencies}
      />
    </div>
  );
}
