import { useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useSettings, type Settings } from "../../store/AppContext";

const OPENROUTER_MODELS = [
  { value: "google/gemma-3-27b-it",             label: "Gemma 3 27B (Google)" },
  { value: "google/gemma-3-12b-it",             label: "Gemma 3 12B (Google)" },
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B (Meta)" },
  { value: "mistralai/mistral-7b-instruct",     label: "Mistral 7B Instruct" },
  { value: "anthropic/claude-3.5-sonnet",       label: "Claude 3.5 Sonnet (Anthropic)" },
  { value: "openai/gpt-4o-mini",                label: "GPT-4o mini (OpenAI via OR)" },
  { value: "openai/gpt-4o",                     label: "GPT-4o (OpenAI via OR)" },
];

export function SettingsPage() {
  const settings = useSettings();
  const dispatch = useAppDispatch();
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showOR, setShowOR] = useState(false);
  const [showGemma, setShowGemma] = useState(false);

  const update = (patch: Partial<Settings>) =>
    dispatch({ type: "SETTINGS_UPDATE", patch });

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Beginner defaults are on. Advanced controls are in the section below when you need them.</p>
      </header>

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

      <GlassPanel title="AI Provider">
        <div className="form-grid">
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
          </label>

          {/* OpenAI key */}
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
              Required for OpenAI provider and Image mode.{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Get key ↗</a>
            </p>
          </label>

          {/* OpenRouter key */}
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
            <p className="input-hint">
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">Get key at openrouter.ai ↗</a>
            </p>
          </label>

          {/* OpenRouter model picker */}
          <label>
            OpenRouter model
            <select
              value={settings.openrouterModel}
              onChange={(e) => update({ openrouterModel: e.target.value })}
            >
              {OPENROUTER_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="input-hint">Used when provider is set to OpenRouter.</p>
          </label>

          {/* Google AI Studio / Gemma key */}
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
              Runs Gemma 3 27B via Google AI Studio.{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get key ↗</a>
            </p>
          </label>

          <p className="input-hint" style={{ gridColumn: "1 / -1", marginTop: "0.25rem" }}>
            All keys are stored locally in your browser and never sent to any server other than the selected provider.
          </p>
        </div>
      </GlassPanel>

      <GlassPanel title="Advanced">
        <div className="form-grid">
          <label>
            Provider routing
            <select
              value={settings.providerRouting}
              onChange={(e) =>
                update({ providerRouting: e.target.value as Settings["providerRouting"] })
              }
            >
              <option value="single">Single provider</option>
              <option value="hybrid">Hybrid provider fallback</option>
            </select>
          </label>
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
    </div>
  );
}

