import { GlassPanel } from "../../components/GlassPanel";

export function SettingsPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Beginner defaults are enabled. Use advanced controls only when needed.</p>
      </header>

      <GlassPanel title="General">
        <div className="form-grid">
          <label>
            Workspace name
            <input defaultValue="VibesAI Workspace" />
          </label>
          <label>
            Default output style
            <select defaultValue="clean">
              <option value="clean">Clean</option>
              <option value="expressive">Expressive</option>
              <option value="technical">Technical</option>
            </select>
          </label>
        </div>
      </GlassPanel>

      <GlassPanel title="Advanced">
        <div className="form-grid">
          <label>
            Provider routing
            <select defaultValue="single">
              <option value="single">Single provider</option>
              <option value="hybrid">Hybrid provider fallback</option>
            </select>
          </label>
          <label>
            Enable experimental image pipeline
            <select defaultValue="off">
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </label>
        </div>
      </GlassPanel>
    </div>
  );
}
