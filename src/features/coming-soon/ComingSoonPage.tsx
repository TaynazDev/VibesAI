import { GlassPanel } from "../../components/GlassPanel";
import { COMING_SOON_FEATURES } from "../../data/comingSoon";

export function ComingSoonPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Coming Soon</h1>
        <p>The next wave of VibesAI features, already staged and tracked.</p>
      </header>

      <GlassPanel>
        <p className="empty-state">
          These are planned features that are already on the roadmap but not active in the product yet.
        </p>
      </GlassPanel>

      <section className="coming-soon-grid" aria-label="Coming soon features">
        {COMING_SOON_FEATURES.map((item) => (
          <article key={item.title} className="coming-soon-card glass">
            <span className="coming-soon-pill">Coming Soon</span>
            <div className="coming-soon-icon" aria-hidden="true">{item.icon}</div>
            <h2 className="coming-soon-title">{item.title}</h2>
            <p className="coming-soon-desc">{item.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
