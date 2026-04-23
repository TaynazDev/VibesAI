import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GlassPanel } from "../../components/GlassPanel";
import { Spinner } from "../../components/Spinner";
import { runAI, type AIMode, type AIOptions, type AIResult } from "../../services/aiService";
import { useAppDispatch, useProjects, useSettings } from "../../store/AppContext";

const aiModes: AIMode[] = ["Generate", "Refactor", "Image"];

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

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const runKey = isMac ? "⌘" : "Ctrl";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projects = useProjects();
  const dispatch = useAppDispatch();
  const settings = useSettings();

  const project = projects.find((p) => p.id === id);

  const hasApiKey =
    (settings.provider === "openrouter" && Boolean(settings.openrouterKey)) ||
    (settings.provider === "gemma" && Boolean(settings.gemmaKey)) ||
    Boolean(settings.apiKey);

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<AIMode>("Generate");
  const [opts] = useState<AIOptions>({ creativity: 62, length: "balanced", references: true });
  const [isRunning, setIsRunning] = useState(false);
  const [liveResult, setLiveResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const placeholder = useMemo(
    () => (!hasApiKey ? "Add your API key in Settings to get started…" : modeHint[mode]),
    [hasApiKey, mode]
  );

  const runPrompt = useCallback(async () => {
    if (!prompt.trim() || isRunning || !project) return;
    setIsRunning(true);
    setError(null);
    setLiveResult(null);
    try {
      const r = await runAI(mode, prompt, opts);
      setLiveResult(r);
      dispatch({
        type: "PROJECT_ADD_MESSAGE",
        id: project.id,
        message: { prompt, mode, result: r, ts: new Date().toLocaleTimeString() },
      });
      dispatch({
        type: "NOTIFICATION_ADD",
        notification: {
          title: `${mode} complete`,
          detail: `"${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}"`,
          timestamp: "just now",
          unread: true,
        },
      });
      setPrompt("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setTimeout(
        () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        80
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsRunning(false);
    }
  }, [dispatch, isRunning, mode, opts, project, prompt]);

  if (!project) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <button type="button" className="back-btn" onClick={() => navigate("/projects")}>
            ← Projects
          </button>
          <h1>Project not found</h1>
        </header>
      </div>
    );
  }

  const messages = project.messages ?? [];

  return (
    <div className="page-stack">
      <header className="page-header">
        <button type="button" className="back-btn" onClick={() => navigate("/projects")}>
          ← Projects
        </button>
        <div>
          <h1>{project.name}</h1>
          <p className="hero-copy">
            <span className={`status ${project.status.toLowerCase()}`}>{project.status}</span>
            {messages.length > 0 && ` · ${messages.length} message${messages.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      {/* ── Composer ──────────────────────────────── */}
      <div className="composer-wrap">
        <GlassPanel>
          <label htmlFor="project-prompt" className="sr-only">Prompt</label>
          <textarea
            ref={textareaRef}
            id="project-prompt"
            className="prompt-input"
            placeholder={placeholder}
            value={prompt}
            rows={1}
            disabled={!hasApiKey}
            onChange={(e) => {
              setPrompt(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runPrompt();
            }}
          />
          <div className="bar-footer">
            <div className="bar-mode-chips" role="tablist" aria-label="AI mode">
              {aiModes.map((m) => (
                <button
                  key={m}
                  className={m === mode ? "bar-chip active" : "bar-chip"}
                  onClick={() => { setMode(m); setLiveResult(null); setError(null); }}
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
                className="run-button"
                onClick={runPrompt}
                disabled={!prompt.trim() || isRunning || !hasApiKey}
              >
                {isRunning ? <Spinner /> : `${modeIcon[mode]} Run`}
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* ── Live result ───────────────────────────── */}
      {(liveResult || error) && (
        <div ref={resultRef}>
          <GlassPanel title="Result">
            {error && <p className="error-text">{error}</p>}
            {liveResult?.type === "text" && (
              <pre className="result-pre">{liveResult.content}</pre>
            )}
            {liveResult?.type === "image" && (
              <img
                className="result-img"
                src={liveResult.url}
                alt={liveResult.alt}
              />
            )}
          </GlassPanel>
        </div>
      )}

      {/* ── Message history ───────────────────────── */}
      {messages.length > 0 && (
        <GlassPanel title={`History (${messages.length})`}>
          <ul className="project-history">
            {messages.map((msg) => (
              <li key={msg.id} className="project-msg">
                <div className="project-msg-meta">
                  <span className="bar-chip">{modeIcon[msg.mode]} {msg.mode}</span>
                  <span className="msg-ts">{msg.ts}</span>
                </div>
                <p className="project-msg-prompt">{msg.prompt}</p>
                {msg.result.type === "text" && (
                  <pre className="result-pre result-pre--compact">{msg.result.content}</pre>
                )}
                {msg.result.type === "image" && (
                  <img className="result-img result-img--small" src={msg.result.url} alt={msg.result.alt} />
                )}
              </li>
            ))}
          </ul>
        </GlassPanel>
      )}

      {messages.length === 0 && !liveResult && (
        <GlassPanel>
          <p className="empty-state">No messages yet. Run a prompt above to get started.</p>
        </GlassPanel>
      )}
    </div>
  );
}
