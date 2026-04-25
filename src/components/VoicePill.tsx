type VoicePillProps = {
  isListening: boolean;
  isSpeaking?: boolean;
  onClick: () => void;
  disabled?: boolean;
  frequencies?: number[];
};

export function VoicePill({
  isListening,
  isSpeaking = false,
  onClick,
  disabled,
  frequencies = Array(9).fill(0),
}: VoicePillProps) {
  // Map frequency values to bar heights
  // Silence: 0.15 (tiny dots)
  // With sound: 0.15 to 1.5 scale based on frequency (tall bars)
  // Center bars are taller, outer bars are shorter (mirrored from center)
  const getBarHeight = (index: number) => {
    const freqValue = frequencies[index] ?? 0;
    
    // When listening, show frequencies with dots as baseline
    if (isListening) {
      // If frequency is very low (near silence), show as tiny dot (0.15 scale)
      if (freqValue < 0.03) {
        return 0.15; // Tiny dot appearance for silence
      }
      
      // Apply center-outward damping: middle bars are taller, outer bars shorter
      // 9 bars total, middle is index 4
      const distanceFromCenter = Math.abs(index - 4);
      const dampingFactor = 1 - (distanceFromCenter * 0.08); // Outer bars at ~65% of center
      
      // Scale range: 0.15 (dot) to 1.5 (tall bar) with damping applied
      const baseHeight = 0.15 + freqValue * 1.35;
      return baseHeight * dampingFactor;
    }
    
    // When not listening, no bars shown
    return 0;
  };

  return (
    <button
      type="button"
      className={`voice-pill${isListening ? " voice-pill--active" : ""}${isSpeaking ? " voice-pill--speaking" : ""}${isListening ? " voice-pill--entering" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      title={isListening ? "Stop listening" : "Start listening"}
    >
      <span className="voice-bars" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="voice-bar"
            style={{
              transform: `scaleY(${getBarHeight(i)})`,
              transition: "transform 80ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        ))}
      </span>
    </button>
  );
}
