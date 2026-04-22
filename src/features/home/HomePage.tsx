import { useMemo, useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";

const aiModes = ["Generate", "Refactor", "Image"] as const;

export function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<(typeof aiModes)[number]>("Generate");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const preview = useMemo(() => {
    if (!prompt.trim()) {
      return "Live preview appears here as you type. Start with a goal, tone, and constraints.";
    }

    return `Mode: ${mode}\n\nPrompt intent: ${prompt.slice(0, 220)}${
      prompt.length > 220 ? "..." : ""
    }\n\nOutput plan:\n- Draft first pass\n- Improve clarity\n- Final polish`;
  }, [mode, prompt]);

  const runPrompt = () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    window.setTimeout(() => setIsRunning(false), 1100);
  };

  return (
    <div className="page-stack home-page">
      <header className="hero">
        <p className="eyebrow">Prism ecosystem app</p>
        <h1>VibesAI</h1>
        <p className="hero-copy">
          Core flow in the center. Power tools on demand. Keep the speed, lose the clutter.
        </p>
      </header>

      <GlassPanel className="composer-wrap">
        <div className="mode-row" role="tablist" aria-label="AI mode">
          {aiModes.map((item) => (
            <button
              key={item}
              className={item === mode ? "chip active" : "chip"}
              onClick={() => setMode(item)}
              role="tab"
              aria-selected={item === mode}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <label htmlFor="prompt" className="sr-only">
          Prompt input
        </label>
        <textarea
          id="prompt"
          className="prompt-input"
          placeholder="Describe what you want to build, improve, or generate..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />

        <div className="composer-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => setShowAdvanced((value) => !value)}
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </button>
          <button type="button" className="run-button" onClick={runPrompt} disabled={isRunning}>
            {isRunning ? "Running..." : `Run ${mode}`}
          </button>
        </div>

        {showAdvanced ? (
          <div className="advanced-grid">
            <label>
              Creativity
              <input type="range" min="0" max="100" defaultValue="62" />
            </label>
            <label>
              Output length
              <select defaultValue="balanced">
                <option value="concise">Concise</option>
                <option value="balanced">Balanced</option>
                <option value="expanded">Expanded</option>
              </select>
            </label>
            <label>
              Include references
              <select defaultValue="yes">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        ) : null}
      </GlassPanel>

      <GlassPanel title="Live Preview">
        <pre className="preview-box">{preview}</pre>
      </GlassPanel>
    </div>
  );
}
