import { useCallback, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { GlassPanel } from "../../components/GlassPanel";
import { Spinner } from "../../components/Spinner";
import { runAI, type AIMode, type AIOptions, type AIResult } from "../../services/aiService";
import { useAppDispatch, useSettings } from "../../store/AppContext";

const aiModes: AIMode[] = ["Generate", "Refactor", "Image"];

type HistoryEntry = {
  id: string;
  prompt: string;
  mode: AIMode;
  result: AIResult;
  ts: string;
};

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const runKey = isMac ? "⌘" : "Ctrl";

const modeIcon: Record<AIMode, string> = {
  Generate: "✦",
  Refactor: "⟳",
  Image:    "◈",
};

const modeHint: Record<AIMode, string> = {
  Generate: "Ask anything…",
  Refactor: "Paste content to refactor…",
  Image:    "Describe an image to generate…",
};

const SUGGESTIONS: { label: string; prompt: string; mode: AIMode }[] = [
  { label: "✦ Write a blog intro",       prompt: "Write an engaging intro for a blog post about the future of AI in everyday life.", mode: "Generate" },
  { label: "◈ Futuristic city concept",  prompt: "A futuristic neon-lit city at night, flying cars, towering glass skyscrapers, cinematic lighting, ultra detailed", mode: "Image" },
  { label: "⟳ Make this more compelling", prompt: "Refactor the following to be more compelling and clear:\n\n", mode: "Refactor" },
  { label: "✦ Explain quantum computing", prompt: "Explain quantum computing in simple terms, with a real-world analogy.", mode: "Generate" },
];

export function HomePage() {
  const dispatch = useAppDispatch();
  const settings = useSettings();
  const hasApiKey = Boolean(settings.apiKey);

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<AIMode>("Generate");
  const [opts, setOpts] = useState<AIOptions>({
    creativity: 62,
    length: "balanced",
    references: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runPrompt = useCallback(async () => {
    if (!prompt.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const r = await runAI(mode, prompt, opts);
      setResult(r);
      setHistory((prev) => [
        { id: String(Date.now()), prompt, mode, result: r, ts: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      dispatch({
        type: "NOTIFICATION_ADD",
        notification: {
          title: `${mode} complete`,
          detail: `"${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}"`,
          timestamp: "just now",
          unread: true,
        },
      });
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        80
      );
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "NO_API_KEY") {
        setError("NO_API_KEY");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      }
    } finally {
      setIsRunning(false);
    }
  }, [dispatch, isRunning, mode, opts, prompt]);

  const copyResult = () => {
    if (result?.type === "text") {
      navigator.clipboard.writeText(result.content).catch(() => {});
    }
  };

  const applySuggestion = (s: (typeof SUGGESTIONS)[number]) => {
    setMode(s.mode);
    setPrompt(s.prompt);
    setResult(null);
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const placeholder = useMemo(() => {
    if (!hasApiKey) return "Add your OpenAI key in Settings to get started…";
    return modeHint[mode];
  }, [hasApiKey, mode]);

  return (
    <div className="page-stack home-page">
      {/* ── Hero ──────────────────────────────────── */}
      <header className="hero">
        <h1>What will you create?</h1>
        <p className="hero-copy">Powered by GPT-4o-mini and DALL·E 3</p>
      </header>

      {/* ── No API key banner ─────────────────────── */}
      {!hasApiKey && (
        <div className="api-key-banner">
          <span>Connect your OpenAI API key to enable AI features.</span>
          <NavLink to="/settings" className="banner-cta">Add key →</NavLink>
        </div>
      )}

      {/* ── Composer (ChatGPT-style) ──────────────── */}
      <div className="composer-wrap">
        <GlassPanel>
          <label htmlFor="prompt" className="sr-only">Prompt</label>
          <textarea
            ref={textareaRef}
            id="prompt"
            className="prompt-input"
            placeholder={placeholder}
            value={prompt}
            rows={1}
            disabled={!hasApiKey}
            onChange={(e) => {
              setPrompt(e.target.value);
              // Auto-expand height
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runPrompt();
            }}
          />

          {/* Bottom strip: mode chips (left) + actions (right) */}
          <div className="bar-footer">
            <div className="bar-mode-chips" role="tablist" aria-label="AI mode">
              {aiModes.map((m) => (
                <button
                  key={m}
                  className={m === mode ? "bar-chip active" : "bar-chip"}
                  onClick={() => { setMode(m); setResult(null); setError(null); }}
                  role="tab"
                  aria-selected={m === mode}
                  type="button"
                >
                  {modeIcon[m]} {m}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {prompt.trim() && !isRunning && (
                <span className="input-hint">{runKey}+↵</span>
              )}
              <button
                type="button"
                className="text-button"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
                title="Options"
                style={{ fontSize: "1rem" }}
              >
                ⚙
              </button>
              <button
                type="button"
                className="send-btn"
                onClick={runPrompt}
                disabled={isRunning || !prompt.trim() || !hasApiKey}
                aria-label="Run"
              >
                {isRunning ? <Spinner label="Running" /> : "↑"}
              </button>
            </div>
          </div>

          {showAdvanced && (
            <div className="advanced-grid" style={{ marginTop: "0.7rem" }}>
              <label>
                Creativity: {opts.creativity}%
                <input
                  type="range" min="0" max="100"
                  value={opts.creativity}
                  onChange={(e) => setOpts((o) => ({ ...o, creativity: Number(e.target.value) }))}
                />
              </label>
              <label>
                Length
                <select
                  value={opts.length}
                  onChange={(e) => setOpts((o) => ({ ...o, length: e.target.value as AIOptions["length"] }))}
                >
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="expanded">Expanded</option>
                </select>
              </label>
              <label>
                References
                <select
                  value={opts.references ? "yes" : "no"}
                  onChange={(e) => setOpts((o) => ({ ...o, references: e.target.value === "yes" }))}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* ── Suggestion starters ───────────────────── */}
      {!result && !error && hasApiKey && !prompt.trim() && (
        <div className="composer-wrap">
          <div className="suggestion-row">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                className="suggestion-chip"
                onClick={() => applySuggestion(s)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Errors ────────────────────────────────── */}
      {error === "NO_API_KEY" && (
        <div className="composer-wrap">
          <GlassPanel>
            <p className="error-text">
              No API key set.{" "}
              <NavLink to="/settings" style={{ display: "inline", color: "var(--accent)" }}>
                Go to Settings →
              </NavLink>
            </p>
          </GlassPanel>
        </div>
      )}
      {error && error !== "NO_API_KEY" && (
        <div className="composer-wrap">
          <GlassPanel>
            <p className="error-text">⚠ {error}</p>
          </GlassPanel>
        </div>
      )}

      {/* ── Result ────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="composer-wrap fade-in">
          <GlassPanel title={`${mode} Result`}>
            <div className="result-toolbar">
              {result.type === "text" ? (
                <>
                  <span className="result-meta">{result.wordCount} words</span>
                  <button type="button" className="text-button" onClick={copyResult}>Copy</button>
                  <button type="button" className="text-button" onClick={runPrompt}>Regenerate</button>
                </>
              ) : (
                <>
                  <span className="result-meta">Image generated</span>
                  <a href={result.url} target="_blank" rel="noreferrer" className="text-button">
                    Open full size ↗
                  </a>
                </>
              )}
            </div>
            {result.type === "text" ? (
              <pre className="result-box">{result.content}</pre>
            ) : (
              <img src={result.url} alt={result.alt} className="result-image" loading="lazy" />
            )}
          </GlassPanel>
        </div>
      )}

      {/* ── History ───────────────────────────────── */}
      {history.length > 0 && (
        <div className="composer-wrap">
          <GlassPanel title="Recent runs">
            <ul className="list-grid">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="list-item history-item"
                  onClick={() => { setPrompt(h.prompt); setMode(h.mode); setResult(h.result); setError(null); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setPrompt(h.prompt); setMode(h.mode); setResult(h.result);
                    }
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "0.86rem" }}>{modeIcon[h.mode]} {h.mode}</strong>
                    <p>"{h.prompt.slice(0, 72)}{h.prompt.length > 72 ? "…" : ""}"</p>
                  </div>
                  <span className="result-meta">{h.ts}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}