import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useSettings, type Settings } from "../../store/AppContext";

export function SettingsPage() {
  const settings = useSettings();
  const dispatch = useAppDispatch();

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
              <option value="system">System default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
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
