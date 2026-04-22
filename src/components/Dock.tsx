import { NavLink } from "react-router-dom";
import { PrismSuiteLogo, VibesAiLogo } from "./BrandLogo";

type DockItem = {
  label: string;
  to: string;
  icon: string;
};

const items: DockItem[] = [
  { label: "Home", to: "/", icon: "◎" },
  { label: "Projects", to: "/projects", icon: "▦" },
  { label: "Alerts", to: "/notifications", icon: "◉" },
  { label: "Settings", to: "/settings", icon: "◌" },
  { label: "Account", to: "/account", icon: "◍" }
];

export function Dock() {
  return (
    <aside className="dock glass" aria-label="Primary navigation">
      <div className="dock-brand">
        <VibesAiLogo className="vibes-logo" />
        <div>
          <div className="brand-main">VibesAI</div>
          <div className="brand-sub">Prism Suite</div>
        </div>
      </div>
      <div className="suite-lockup">
        <PrismSuiteLogo className="prism-logo" />
      </div>
      <nav>
        <ul className="dock-list">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "dock-link active" : "dock-link"
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
