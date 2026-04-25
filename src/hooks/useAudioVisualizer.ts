import { useCallback, useEffect, useRef, useState } from "react";

type AudioVisualizerData = {
  frequencies: number[];
  amplitude: number;
  isSilent: boolean;
};

type UseAudioVisualizerOptions = {
  onSilenceTimeout?: () => void; // Called when silence detected for threshold duration
  silenceThreshold?: number; // Amplitude threshold for detecting silence (0-1)
  silenceTimeoutMs?: number; // Time to wait before calling onSilenceTimeout
};

/**
 * Hook to capture microphone audio and extract frequency/amplitude data
 * for real-time voice visualization. Falls back to pattern-based animation
 * if audio capture is unavailable. Detects silence and can trigger callbacks.
 */
export function useAudioVisualizer(options: UseAudioVisualizerOptions = {}) {
  const {
    onSilenceTimeout,
    silenceThreshold = 0.02,
    silenceTimeoutMs = 1500,
  } = options;

  const [audioData, setAudioData] = useState<AudioVisualizerData>({
    frequencies: Array(9).fill(0),
    amplitude: 0,
    isSilent: false,
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isFallbackRef = useRef(false);
  const isRunningRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const displayFrequenciesRef = useRef<number[]>(Array(9).fill(0));

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Start silence timeout
  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (onSilenceTimeout) {
        onSilenceTimeout();
      }
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, onSilenceTimeout, silenceTimeoutMs]);

  const startFallbackAnimation = () => {
    if (isFallbackRef.current && animFrameRef.current) {
      return; // Already running
    }
    isFallbackRef.current = true;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const frequencies: number[] = [];

      // Create varied wave pattern - slower and more dramatic
      // Uses multiple wave frequencies for richer animation
      for (let i = 0; i < 9; i++) {
        // Primary wave: slow oscillation
        const phase1 = (elapsed / 250) + (i * 0.5);
        const wave1 = Math.sin(phase1);
        
        // Secondary wave: faster counter-oscillation
        const phase2 = (elapsed / 150) - (i * 0.3);
        const wave2 = Math.sin(phase2) * 0.4;
        
        // Combine waves for organic movement
        const value = (wave1 + wave2 + 1.5) / 3; // Normalize to roughly 0-1
        frequencies[i] = Math.max(0, Math.min(1, value));
      }

      setAudioData({
        frequencies,
        amplitude: (Math.sin(elapsed / 300) + 1) / 2,
        isSilent: false,
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const start = useCallback(async () => {
    // Prevent starting multiple times
    if (isRunningRef.current) {
      return;
    }
    isRunningRef.current = true;
    lastSoundTimeRef.current = Date.now();
    displayFrequenciesRef.current = Array(9).fill(0);
    clearSilenceTimer();

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create audio context
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      // Create analyser node
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256; // 128 frequency bins
      analyser.smoothingTimeConstant = 0.7;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start visualization loop
      const analyze = () => {
        if (!analyser || !isRunningRef.current) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Calculate overall amplitude for silence detection
        const allSum = dataArray.reduce((a, b) => a + b, 0);
        const amplitude = Math.min(1, allSum / (dataArray.length * 255));

        // Detect silence
        const isSilent = amplitude < silenceThreshold;

        if (!isSilent) {
          // Sound detected - reset silence timer and update last sound time
          lastSoundTimeRef.current = Date.now();
          clearSilenceTimer();

          // Map frequency bins to 9 bars with more sensitivity
          const barCount = 9;
          const binPerBar = Math.floor(dataArray.length / barCount);
          const frequencies: number[] = [];

          for (let i = 0; i < barCount; i++) {
            const startBin = i * binPerBar;
            const endBin = (i + 1) * binPerBar;
            let sum = 0;

            for (let j = startBin; j < endBin; j++) {
              sum += (dataArray[j] ?? 0);
            }

            const average = sum / (endBin - startBin);
            // Boost sensitivity and normalize
            const normalized = Math.min(1, (average / 255) * 1.5);
            frequencies[i] = normalized;
          }

          displayFrequenciesRef.current = frequencies;
        } else {
          // Silence detected - decay frequencies to 0 smoothly
          for (let i = 0; i < 9; i++) {
            displayFrequenciesRef.current[i] *= 0.85; // Decay rate
          }

          // Start silence timer if not already running
          if (!silenceTimerRef.current) {
            startSilenceTimer();
          }
        }

        setAudioData({
          frequencies: displayFrequenciesRef.current,
          amplitude,
          isSilent,
        });

        animFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
      isFallbackRef.current = false;
    } catch (error) {
      console.warn(
        "Failed to access microphone for visualization, using fallback animation:",
        error
      );
      // Fallback to pattern-based animation
      startFallbackAnimation();
    }
  }, [clearSilenceTimer, silenceThreshold, startSilenceTimer]);

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    isFallbackRef.current = false;
    isRunningRef.current = false;
    clearSilenceTimer();

    // Reset data
    setAudioData({
      frequencies: Array(9).fill(0),
      amplitude: 0,
      isSilent: false,
    });
    displayFrequenciesRef.current = Array(9).fill(0);
  }, [clearSilenceTimer]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { audioData, start, stop };
}
