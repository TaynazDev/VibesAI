type OnboardingPageProps = {
  onDone: () => void;
};

const STEPS = [
  {
    title: "1. Start In Builder",
    detail: "Go Home to describe your app idea, generate a plan, and move through staged build steps.",
  },
  {
    title: "2. Use AI Chat",
    detail: "Open AI Chat for rapid brainstorming, copy help, and quick back-and-forth support.",
  },
  {
    title: "3. Save Through Projects",
    detail: "Your builder sessions and generated previews save into Projects so you can resume anytime.",
  },
  {
    title: "4. Configure Keys",
    detail: "In Settings, add one or more AI provider keys. VibesAI can route requests using available keys.",
  },
  {
    title: "5. Ship And Iterate",
    detail: "Use checkpoints, live preview, and exports to test quickly and keep improving your app.",
  },
];

export function OnboardingPage({ onDone }: OnboardingPageProps) {
  return (
    <div className="onboarding-root" role="dialog" aria-modal="true" aria-label="Welcome to VibesAI">
      <div className="onboarding-card glass">
        <p className="onboarding-kicker">Welcome</p>
        <h1>How To Use VibesAI</h1>
        <p className="onboarding-subcopy">
          Quick guide for your first session. You can skip this and start immediately, but this flow helps you get value faster.
        </p>

        <div className="onboarding-steps" aria-label="Onboarding steps">
          {STEPS.map((step) => (
            <article key={step.title} className="onboarding-step">
              <h2>{step.title}</h2>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>

        <div className="onboarding-actions">
          <button type="button" className="text-button" onClick={onDone}>
            Skip For Now
          </button>
          <button type="button" className="run-button" onClick={onDone}>
            Enter VibesAI
          </button>
        </div>
      </div>
    </div>
  );
}
