import { useCallback, useMemo, useRef, useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";
import { Spinner } from "../../components/Spinner";
import { runAI, type AIMode, type AIOptions, type AIResult } from "../../services/aiService";
import { useAppDispatch } from "../../store/AppContext";

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

export function HomePage() {
  const dispatch = useAppDispatch();
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
        60
      );
    } catch {
      setError("Something went wrong. Check your prompt and try again.");
    } finally {
      setIsRunning(false);
    }
  }, [dispatch, isRunning, mode, opts, prompt]);

  const copyResult = () => {
    if (result?.type === "text") {
      navigator.clipboard.writeText(result.content).catch(() => {});
    }
  };

  const livePreviewText = useMemo(() => {
    if (isRunning) return "Thinking…";
    if (!prompt.trim())
      return "Live preview appears here as you type.\nStart with a goal, tone, and constraints.";
    return `Mode: ${mode}  ·  Length: ${opts.length}  ·  Creativity: ${opts.creativity}%\n\n"${prompt.slice(0, 160)}${prompt.length > 160 ? "…" : ""}"`;
  }, [isRunning, mode, opts.creativity, opts.length, prompt]);

  const modeHint: Record<AIMode, string> = {
    Generate: "Describe what you want to build, write, or create…",
    Refactor: "Paste the content you want to improve or rewrite…",
    Image: "Describe the image you want to generate in detail…",
  };

  return (
    <div className="page-stack home-page">
      <header className="hero">
        <p className="eyebrow">Prism ecosystem app</p>
        <h1>VibesAI</h1>
        <p className="hero-copy">Core flow in the center. Power tools on demand.</p>
      </header>

      {/* ── Composer ──────────────────────────────── */}
      <GlassPanel className="composer-wrap">
        <div className="mode-row" role="tablist" aria-label="AI mode">
          {aiModes.map((m) => (
            <button
              key={m}
              className={m === mode ? "chip active" : "chip"}
              onClick={() => {
                setMode(m);
                setResult(null);
                setError(null);
              }}
              role="tab"
              aria-selected={m === mode}
              type="button"
            >
              {m}
            </button>
          ))}
        </div>

        <label htmlFor="prompt" className="sr-only">
          Prompt
        </label>
        <textarea
          id="prompt"
          className="prompt-input"
          placeholder={modeHint[mode]}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runPrompt();
          }}
        />
        <p className="input-hint">{runKey}+Enter to run</p>

        <div className="composer-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? "Advanced ▲" : "Advanced ▼"}
          </button>
          <button
            type="button"
            className="run-button"
            onClick={runPrompt}
            disabled={isRunning || !prompt.trim()}
          >
            {isRunning ? (
              <>
                <Spinner label="Running" /> Running…
              </>
            ) : (
              `Run ${mode}`
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="advanced-grid">
            <label>
              Creativity: {opts.creativity}%
              <input
                type="range"
                min="0"
                max="100"
                value={opts.creativity}
                onChange={(e) =>
                  setOpts((o) => ({ ...o, creativity: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              Output length
              <select
                value={opts.length}
                onChange={(e) =>
                  setOpts((o) => ({ ...o, length: e.target.value as AIOptions["length"] }))
                }
              >
                <option value="concise">Concise</option>
                <option value="balanced">Balanced</option>
                <option value="expanded">Expanded</option>
              </select>
            </label>
            <label>
              Include references
              <select
                value={opts.references ? "yes" : "no"}
                onChange={(e) =>
                  setOpts((o) => ({ ...o, references: e.target.value === "yes" }))
                }
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        )}
      </GlassPanel>

      {/* ── Live preview (hidden when result is shown) ── */}
      {!result && !error && (
        <GlassPanel title="Live Preview">
          <pre className="preview-box">{livePreviewText}</pre>
        </GlassPanel>
      )}

      {/* ── Error ─────────────────────────────────── */}
      {error && (
        <GlassPanel className="error-panel">
          <p className="error-text">⚠ {error}</p>
        </GlassPanel>
      )}

      {/* ── Result ────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="fade-in">
          <GlassPanel title={`${mode} Result`}>
            <div className="result-toolbar">
              {result.type === "text" ? (
                <>
                  <span className="result-meta">{result.wordCount} words</span>
                  <button type="button" className="text-button" onClick={copyResult}>
                    Copy ↗
                  </button>
                  <button type="button" className="text-button" onClick={runPrompt}>
                    Regenerate ↺
                  </button>
                </>
              ) : (
                <>
                  <span className="result-meta">Generated image</span>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-button"
                  >
                    Open full size ↗
                  </a>
                </>
              )}
            </div>

            {result.type === "text" ? (
              <pre className="result-box">{result.content}</pre>
            ) : (
              <img
                src={result.url}
                alt={result.alt}
                className="result-image"
                loading="lazy"
              />
            )}
          </GlassPanel>
        </div>
      )}

      {/* ── History ───────────────────────────────── */}
      {history.length > 0 && (
        <GlassPanel title="Recent runs">
          <ul className="list-grid">
            {history.map((h) => (
              <li
                key={h.id}
                className="list-item history-item"
                onClick={() => {
                  setPrompt(h.prompt);
                  setMode(h.mode);
                  setResult(h.result);
                  setError(null);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setPrompt(h.prompt);
                    setMode(h.mode);
                    setResult(h.result);
                  }
                }}
              >
                <div>
                  <strong>{h.mode}</strong>
                  <p>
                    "{h.prompt.slice(0, 72)}
                    {h.prompt.length > 72 ? "…" : ""}"
                  </p>
                </div>
                <span className="result-meta">{h.ts}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}
    </div>
  );
}
