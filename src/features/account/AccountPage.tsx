import { GlassPanel } from "../../components/GlassPanel";
import { useAppDispatch, useAuth, useNotifications, useProjects, useSettings } from "../../store/AppContext";

export function AccountPage() {
  const auth = useAuth();
  const dispatch = useAppDispatch();
  const projects = useProjects();
  const { unreadCount } = useNotifications();
  const settings = useSettings();

  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Account</h1>
        <p>Profile and workspace identity.</p>
      </header>

      <GlassPanel>
        <div className="account-hero">
          <div className="account-avatar">{auth.name.slice(0, 1).toUpperCase()}</div>
          <div className="account-hero-copy">
            <p className="eyebrow">{auth.role}</p>
            <h2 className="account-name">{auth.name}</h2>
            <p className="account-focus">{auth.focus}</p>
            <div className="account-meta-row">
              <span className="badge">{auth.studio}</span>
              <span className="badge muted">{settings.workspaceName}</span>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="stats-grid">
        <GlassPanel className="stat-panel">
          <span className="stat-label">Projects</span>
          <strong className="stat-value">{projects.length}</strong>
          <p className="stat-copy">Ideas currently saved.</p>
        </GlassPanel>
        <GlassPanel className="stat-panel">
          <span className="stat-label">Unread</span>
          <strong className="stat-value">{unreadCount}</strong>
          <p className="stat-copy">Items still waiting for you.</p>
        </GlassPanel>
        <GlassPanel className="stat-panel">
          <span className="stat-label">Theme</span>
          <strong className="stat-value stat-value--compact">{settings.theme}</strong>
          <p className="stat-copy">Visual mode for the workspace.</p>
        </GlassPanel>
      </div>

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
          <label>
            Role
            <input
              value={auth.role}
              onChange={(e) =>
                dispatch({ type: "AUTH_UPDATE", patch: { role: e.target.value } })
              }
            />
          </label>
          <label>
            Studio
            <input
              value={auth.studio}
              onChange={(e) =>
                dispatch({ type: "AUTH_UPDATE", patch: { studio: e.target.value } })
              }
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Creative focus
            <input
              value={auth.focus}
              onChange={(e) =>
                dispatch({ type: "AUTH_UPDATE", patch: { focus: e.target.value } })
              }
            />
          </label>
        </div>
      </GlassPanel>

      <GlassPanel title="Workspace Signature">
        <div className="workspace-actions">
          <div className="workspace-action-card">
            <strong>Default output tone</strong>
            <p>{settings.outputStyle} responses tuned for {auth.studio}.</p>
          </div>
          <div className="workspace-action-card">
            <strong>Current provider</strong>
            <p>{settings.provider} is active for generation right now.</p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
