import { GlassPanel } from "../../components/GlassPanel";
import { PrismSuiteLogo, VibesAiLogo } from "../../components/BrandLogo";
import { useAppDispatch, useAuth } from "../../store/AppContext";

export function AccountPage() {
  const auth = useAuth();
  const dispatch = useAppDispatch();

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Account</h1>
        <p>VibesAI profile and Prism ecosystem identity.</p>
      </header>

      <GlassPanel title="Profile">
        <div className="form-grid">
          <label>
            Display name
            <input
              value={auth.name}
              onChange={(e) =>
                dispatch({ type: "AUTH_UPDATE", patch: { name: e.target.value } })
              }
            />
          </label>
          <label>
            Email
            <input
              value={auth.email}
              onChange={(e) =>
                dispatch({ type: "AUTH_UPDATE", patch: { email: e.target.value } })
              }
            />
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
