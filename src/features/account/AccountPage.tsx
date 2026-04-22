import { GlassPanel } from "../../components/GlassPanel";
import { PrismSuiteLogo, VibesAiLogo } from "../../components/BrandLogo";

export function AccountPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Account</h1>
        <p>VibesAI profile and Prism ecosystem identity settings.</p>
      </header>

      <GlassPanel title="Profile">
        <div className="form-grid">
          <label>
            Display name
            <input defaultValue="Creator One" />
          </label>
          <label>
            Email
            <input defaultValue="creator@prism.example" />
          </label>
        </div>
      </GlassPanel>

      <GlassPanel title="Branding">
        <p>
          Product name in app UI: <strong>VibesAI</strong>
        </p>
        <p>
          Full legal/ecosystem name: <strong>VibesAI by Prism</strong>
        </p>
        <div className="branding-preview">
          <div>
            <p>VibesAI mark</p>
            <VibesAiLogo className="branding-vibes" />
          </div>
          <div>
            <p>Prism suite mark</p>
            <PrismSuiteLogo className="branding-prism" />
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
