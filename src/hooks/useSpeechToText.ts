import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

type SpeechToTextOptions = {
  lang?: string;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
};

export function useSpeechToText(options: SpeechToTextOptions = {}) {
  const {
    lang = "en-US",
    onInterimTranscript,
    onFinalTranscript,
    onListeningChange,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const scheduleSilenceStop = useCallback((rec: SpeechRecognition, timeoutMs: number) => {
    clearSilenceTimeout();
    silenceTimeoutRef.current = window.setTimeout(() => {
      try {
        rec.stop();
      } catch {
        // no-op
      }
    }, timeoutMs);
  }, [clearSilenceTimeout]);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      const finalParts: string[] = [];

      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const segment = e.results[i]?.[0]?.transcript?.trim();
        if (!segment) continue;
        if (e.results[i].isFinal) {
          finalParts.push(segment);
        } else {
          interimText += `${segment} `;
        }
      }

      if (interimText && onInterimTranscript) {
        onInterimTranscript(interimText.trim());
      } else if (onInterimTranscript) {
        onInterimTranscript("");
      }

      if (interimText || finalParts.length > 0) {
        setIsSpeaking(true);
        if (speakingTimeoutRef.current) {
          window.clearTimeout(speakingTimeoutRef.current);
        }
        speakingTimeoutRef.current = window.setTimeout(() => {
          setIsSpeaking(false);
        }, 700);

        // Stop after inactivity: 2.5s normally, 5s when filler speech is detected (e.g. "uh").
        const heardText = `${interimText} ${finalParts.join(" ")}`.trim();
        const hasFiller = /\b(uh+|um+|er+|ah+)\b/i.test(heardText);
        scheduleSilenceStop(rec, hasFiller ? 5000 : 2500);
      }

      if (finalParts.length > 0 && onFinalTranscript) {
        onFinalTranscript(finalParts.join(" ").trim());
      }
    };

    rec.onerror = () => {
      setIsSpeaking(false);
    };

    rec.onend = () => {
      if (onInterimTranscript) onInterimTranscript("");
      setIsSpeaking(false);
      clearSilenceTimeout();
      setIsListening(false);
      onListeningChange?.(false);
    };

    recogRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      setIsSpeaking(false);
      onListeningChange?.(true);
      // If no speech is detected at all, close after 2.5s.
      scheduleSilenceStop(rec, 2500);
    } catch {
      setIsListening(false);
      setIsSpeaking(false);
      onListeningChange?.(false);
    }
  }, [clearSilenceTimeout, lang, onFinalTranscript, onInterimTranscript, onListeningChange, scheduleSilenceStop]);

  const stop = useCallback(() => {
    if (onInterimTranscript) onInterimTranscript("");
    setIsSpeaking(false);
    if (speakingTimeoutRef.current) {
      window.clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
    clearSilenceTimeout();
    try {
      recogRef.current?.stop();
    } catch {
      // Ignore stop errors from idle recognizer.
    }
  }, [clearSilenceTimeout, onInterimTranscript]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(() => {
    return () => {
      if (speakingTimeoutRef.current) {
        window.clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = null;
      }
      clearSilenceTimeout();
      try {
        recogRef.current?.stop();
      } catch {
        // no-op
      }
    };
  }, [clearSilenceTimeout]);

  return { isListening, isSpeaking, supported, toggle, stop };
}
