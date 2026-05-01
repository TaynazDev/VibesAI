import { useMemo, useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useNotifications, useProjects, useSettings, type Settings } from "../../store/AppContext";

type Provider = Settings["provider"];

const OPENROUTER_FREE_MODELS = [
  { value: "google/gemma-2-9b-it:free", label: "Gemma 2 9B Instruct — Free" },
  { value: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B Instruct — Free" },
  { value: "microsoft/phi-3-mini-128k-instruct:free", label: "Phi-3 Mini 128K — Free" },
  { value: "qwen/qwen-2.5-7b-instruct:free", label: "Qwen 2.5 7B Instruct — Free" },
  { value: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B Instruct — Free" },
];

const OPENROUTER_PAID_MODELS = [
  { value: "google/gemma-3-27b-it", label: "Gemma 3 27B Instruct" },
  { value: "openai/gpt-4o", label: "GPT-4o" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro" },
];

export function SettingsPage() {
  const settings = useSettings();
  const dispatch = useAppDispatch();
  const projects = useProjects();
  const { notifications } = useNotifications();
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showOR, setShowOR] = useState(false);
  const [showGemma, setShowGemma] = useState(false);
  const [showOpenAIFallback, setShowOpenAIFallback] = useState(false);
  const [showORFallback, setShowORFallback] = useState(false);
  const [showGemmaFallback, setShowGemmaFallback] = useState(false);
  const [draggingProvider, setDraggingProvider] = useState<Provider | null>(null);

  const currentOpenRouterOption = useMemo(() => {
    const curated = [...OPENROUTER_FREE_MODELS, ...OPENROUTER_PAID_MODELS];
    if (curated.some((model) => model.value === settings.openrouterModel)) {
      return null;
    }
    return {
      value: settings.openrouterModel,
      label: `${settings.openrouterModel} — Current`,
    };
  }, [settings.openrouterModel]);

  const update = (patch: Partial<Settings>) =>
    dispatch({ type: "SETTINGS_UPDATE", patch });

  const toLines = (values: string[]) => values.join("\n");
  const parseLines = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter((line, i, arr) => Boolean(line) && arr.indexOf(line) === i);

  const providerReadiness = {
    openai: Boolean(settings.apiKey || settings.openaiFallbackKeys.length > 0),
    openrouter: Boolean(settings.openrouterKey || settings.openrouterFallbackKeys.length > 0),
    gemma: Boolean(settings.gemmaKey || settings.gemmaFallbackKeys.length > 0),
  };

  const providerNames: Record<Provider, string> = {
    openai: "OpenAI",
    openrouter: "OpenRouter",
    gemma: "Gemma",
  };

  const moveProviderOrder = (from: Provider, to: Provider) => {
    if (from === to) return;
    const order = [...settings.fallbackOrder];
    const fromIndex = order.indexOf(from);
    const toIndex = order.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) return;
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, from);
    update({ fallbackOrder: order });
  };

  const providerHintBySelected: Record<Provider, string> = {
    openai: "Only OpenAI fields are shown while OpenAI is selected.",
    openrouter: "Only OpenRouter fields are shown while OpenRouter is selected.",
    gemma: "Only Gemma fields are shown while Gemma is selected.",
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Beginner defaults are on. Advanced controls are in the section below when you need them.</p>
      </header>

      <div className="stats-grid">
        <GlassPanel className="stat-panel">
          <span className="stat-label">Active Provider</span>
          <strong className="stat-value stat-value--compact">{settings.provider}</strong>
          <p className="stat-copy">Current generation engine.</p>
        </GlassPanel>
        <GlassPanel className="stat-panel">
          <span className="stat-label">Projects</span>
          <strong className="stat-value">{projects.length}</strong>
          <p className="stat-copy">Saved in your local workspace.</p>
        </GlassPanel>
        <GlassPanel className="stat-panel">
          <span className="stat-label">Notifications</span>
          <strong className="stat-value">{notifications.length}</strong>
          <p className="stat-copy">Activity stored locally.</p>
        </GlassPanel>
      </div>

      <GlassPanel title="General">
        <div className="form-grid">
          <label>
            Workspace name
            <input
              value={settings.workspaceName}
              onChange={(e) => update({ workspaceName: e.target.value })}
            />
          </label>
          <label>
            Default output style
            <select
              value={settings.outputStyle}
              onChange={(e) =>
                update({ outputStyle: e.target.value as Settings["outputStyle"] })
              }
            >
              <option value="clean">Clean</option>
              <option value="expressive">Expressive</option>
              <option value="technical">Technical</option>
            </select>
          </label>
          <label>
            App theme
            <select
              value={settings.theme}
              onChange={(e) => update({ theme: e.target.value as Settings["theme"] })}
            >
              <option value="system">Device default (syncs with OS)</option>
              <option value="dark">Dark — pink accents</option>
              <option value="light">Light — blue accents</option>
            </select>
          </label>
        </div>
      </GlassPanel>

      <GlassPanel title="AI Provider (Unified)">
        <div className="form-grid">
          <label>
            Provider readiness
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.45rem" }}>
              <span className={providerReadiness.openai ? "badge" : "badge muted"}>OpenAI {providerReadiness.openai ? "Ready" : "Missing"}</span>
              <span className={providerReadiness.openrouter ? "badge" : "badge muted"}>OpenRouter {providerReadiness.openrouter ? "Ready" : "Missing"}</span>
              <span className={providerReadiness.gemma ? "badge" : "badge muted"}>Gemma {providerReadiness.gemma ? "Ready" : "Missing"}</span>
            </div>
          </label>

          <label>
            Active provider
            <select
              value={settings.provider}
              onChange={(e) => update({ provider: e.target.value as Settings["provider"] })}
            >
              <option value="openai">OpenAI (GPT-4o-mini + DALL·E 3)</option>
              <option value="openrouter">OpenRouter (access 300+ models)</option>
              <option value="gemma">Google AI Studio (Gemma direct)</option>
            </select>
            <p className="input-hint">{providerHintBySelected[settings.provider]}</p>
          </label>

          {settings.provider === "openai" && (
            <label>
              OpenAI API Key
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type={showOpenAI ? "text" : "password"}
                  placeholder="sk-..."
                  value={settings.apiKey}
                  onChange={(e) => update({ apiKey: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ flex: 1 }}
                />
                <button type="button" className="text-button" onClick={() => setShowOpenAI((v) => !v)} style={{ flexShrink: 0 }}>
                  {showOpenAI ? "Hide" : "Show"}
                </button>
              </div>
              <p className="input-hint">
                Required for OpenAI provider and Image mode. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Get key ↗</a>
              </p>
            </label>
          )}

          {settings.provider === "openrouter" && (
            <>
              <label>
                OpenRouter API Key
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type={showOR ? "text" : "password"}
                    placeholder="sk-or-..."
                    value={settings.openrouterKey}
                    onChange={(e) => update({ openrouterKey: e.target.value })}
                    autoComplete="off"
                    spellCheck={false}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="text-button" onClick={() => setShowOR((v) => !v)} style={{ flexShrink: 0 }}>
                    {showOR ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="input-hint"><a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">Get key at openrouter.ai ↗</a></p>
              </label>

              <label>
                OpenRouter model
                <select
                  value={settings.openrouterModel}
                  onChange={(e) => update({ openrouterModel: e.target.value })}
                >
                  {currentOpenRouterOption && (
                    <option value={currentOpenRouterOption.value}>{currentOpenRouterOption.label}</option>
                  )}
                  <optgroup label="Free Models">
                    {OPENROUTER_FREE_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Paid Models">
                    {OPENROUTER_PAID_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </optgroup>
                </select>
                <p className="input-hint">Five curated free models first, then top paid models.</p>
              </label>
            </>
          )}

          {settings.provider === "gemma" && (
            <label>
              Google AI Studio Key (Gemma)
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type={showGemma ? "text" : "password"}
                  placeholder="AIza..."
                  value={settings.gemmaKey}
                  onChange={(e) => update({ gemmaKey: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ flex: 1 }}
                />
                <button type="button" className="text-button" onClick={() => setShowGemma((v) => !v)} style={{ flexShrink: 0 }}>
                  {showGemma ? "Hide" : "Show"}
                </button>
              </div>
              <p className="input-hint">
                Runs Gemma via Google AI Studio. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get key ↗</a>
              </p>
            </label>
          )}

          <label>
            Experimental fallback mode
            <select
              value={settings.experimentalFallback ? "on" : "off"}
              onChange={(e) => {
                const enabled = e.target.value === "on";
                update({
                  experimentalFallback: enabled,
                  providerRouting: enabled ? "hybrid" : settings.providerRouting,
                });
              }}
            >
              <option value="off">Off</option>
              <option value="on">On (multi-key + cross-provider fallback)</option>
            </select>
          </label>

          {settings.experimentalFallback && (
            <div style={{ gridColumn: "1 / -1", display: "grid", gap: "0.8rem" }}>
              <div>
                <strong style={{ fontSize: "0.86rem", color: "var(--ink-main)" }}>Fallback order (drag to reorder)</strong>
                <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.55rem" }}>
                  {settings.fallbackOrder.map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      className="chip"
                      draggable
                      onDragStart={() => setDraggingProvider(provider)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggingProvider) {
                          moveProviderOrder(draggingProvider, provider);
                        }
                        setDraggingProvider(null);
                      }}
                    >
                      {providerNames[provider]}
                    </button>
                  ))}
                </div>
                <p className="input-hint">Primary provider is always tried first, then this order.</p>
              </div>

              <div className="form-grid">
                <label>
                  OpenAI fallback keys (one per line)
                  <textarea
                    rows={3}
                    value={toLines(settings.openaiFallbackKeys)}
                    onChange={(e) => update({ openaiFallbackKeys: parseLines(e.target.value) })}
                    placeholder="sk-..."
                  />
                  <button type="button" className="text-button" onClick={() => setShowOpenAIFallback((v) => !v)}>
                    {showOpenAIFallback ? "Hide" : "Show"} values
                  </button>
                  {showOpenAIFallback && <p className="input-hint">{toLines(settings.openaiFallbackKeys) || "No fallback keys added."}</p>}
                </label>

                <label>
                  OpenRouter fallback keys (one per line)
                  <textarea
                    rows={3}
                    value={toLines(settings.openrouterFallbackKeys)}
                    onChange={(e) => update({ openrouterFallbackKeys: parseLines(e.target.value) })}
                    placeholder="sk-or-..."
                  />
                  <button type="button" className="text-button" onClick={() => setShowORFallback((v) => !v)}>
                    {showORFallback ? "Hide" : "Show"} values
                  </button>
                  {showORFallback && <p className="input-hint">{toLines(settings.openrouterFallbackKeys) || "No fallback keys added."}</p>}
                </label>

                <label>
                  Gemma fallback keys (one per line)
                  <textarea
                    rows={3}
                    value={toLines(settings.gemmaFallbackKeys)}
                    onChange={(e) => update({ gemmaFallbackKeys: parseLines(e.target.value) })}
                    placeholder="AIza..."
                  />
                  <button type="button" className="text-button" onClick={() => setShowGemmaFallback((v) => !v)}>
                    {showGemmaFallback ? "Hide" : "Show"} values
                  </button>
                  {showGemmaFallback && <p className="input-hint">{toLines(settings.gemmaFallbackKeys) || "No fallback keys added."}</p>}
                </label>

                <label>
                  OpenRouter fallback models (one per line)
                  <textarea
                    rows={3}
                    value={toLines(settings.openrouterFallbackModels)}
                    onChange={(e) => update({ openrouterFallbackModels: parseLines(e.target.value) })}
                    placeholder="meta-llama/llama-3.2-3b-instruct:free"
                  />
                </label>
              </div>
            </div>
          )}

          <p className="input-hint" style={{ gridColumn: "1 / -1", marginTop: "0.25rem" }}>
            All keys are stored locally in your browser and never sent to any server other than the selected provider.
          </p>
        </div>
      </GlassPanel>

      <GlassPanel title="Advanced">
        <div className="form-grid">
          <label>
            Experimental image pipeline
            <select
              value={settings.experimentalImage ? "on" : "off"}
              onChange={(e) => update({ experimentalImage: e.target.value === "on" })}
            >
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>
        </div>
      </GlassPanel>

      <GlassPanel title="Workspace Data">
        <div className="workspace-actions">
          <div className="workspace-action-card">
            <strong>Notifications hygiene</strong>
            <p>Clear all already-read items while keeping unread alerts visible.</p>
            <button
              type="button"
              className="text-button"
              onClick={() => dispatch({ type: "NOTIFICATION_CLEAR_READ" })}
            >
              Clear read notifications
            </button>
          </div>
          <div className="workspace-action-card">
            <strong>Builder resume target</strong>
            <p>Forget the currently resumed builder project so home starts fresh next time.</p>
            <button
              type="button"
              className="text-button"
              onClick={() => sessionStorage.removeItem("va_builder_project_id")}
            >
              Forget active builder session
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

