import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useAuth } from "../../store/AppContext";

export function AccountPage() {
  const auth = useAuth();
  const dispatch = useAppDispatch();

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Account</h1>
        <p>Profile and workspace identity.</p>
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

      <GlassPanel title="Preferences">
        <p className="empty-state">A minimal identity-first view keeps this workspace focused.</p>
      </GlassPanel>
    </div>
  );
}
