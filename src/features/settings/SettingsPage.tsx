import { useState } from "react";
import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useSettings, type Settings } from "../../store/AppContext";

export function SettingsPage() {
  const settings = useSettings();
  const dispatch = useAppDispatch();
  const [showKey, setShowKey] = useState(false);

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

      <GlassPanel title="Advanced">
        <div className="form-grid">
          <label>
            OpenAI API Key
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={settings.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
                autoComplete="off"
                spellCheck={false}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="text-button"
                onClick={() => setShowKey((v) => !v)}
                style={{ flexShrink: 0 }}
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="input-hint">
              Get your key at{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                platform.openai.com
              </a>
              . Stored locally in your browser only.
            </p>
          </label>
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
