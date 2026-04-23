import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { GlassPanel } from "../../components/GlassPanel";
import { Spinner } from "../../components/Spinner";
import { generatePlan, runBuilderStep } from "../../services/builderService";
import { useSettings } from "../../store/AppContext";
import type { AppPlan, BuildMessage, BuildStep, Checkpoint } from "./buildTypes";
import { STEP_DESCRIPTIONS, STEP_LABELS } from "./buildTypes";
import { LivePreview } from "./LivePreview";

const uid = () => Math.random().toString(36).slice(2, 10);

const STEP_INTROS: Record<number, string> = {
  1: "Build the initial prototype based on the plan. Make it visually polished and modern.",
  2: "Implement all the features to make the app fully functional.",
  3: "Polish the visual design — make it look premium and professional.",
  4: "Analyse the current app carefully and ask me 3 smart, proactive questions about what to finalize or improve.",
};

// ── Sub-components ────────────────────────────────────────────────────────

function StepBar({
  step,
  maxReached,
  onStepClick,
}: {
  step: BuildStep;
  maxReached: BuildStep;
  onStepClick: (s: BuildStep) => void;
}) {
  return (
    <div className="step-bar" role="tablist" aria-label="Builder steps">
      {([0, 1, 2, 3, 4] as BuildStep[]).map((s, i) => {
        const isActive = s === step;
        const isCompleted = s < step;
        const isDisabled = s > maxReached;
        return (
          <button
            key={s}
            role="tab"
            aria-selected={isActive}
            className={`step-dot${isActive ? " active" : ""}${isCompleted ? " completed" : ""}${isDisabled ? " disabled" : ""}`}
            onClick={() => !isDisabled && onStepClick(s)}
            disabled={isDisabled}
            title={STEP_LABELS[s]}
          >
            <span className="step-dot-num">{isCompleted ? "✓" : i + 1}</span>
            <span className="step-dot-name">{STEP_LABELS[s]}</span>
          </button>
        );
      })}
    </div>
  );
}

function ChatBubble({
  msg,
  onSuggestion,
}: {
  msg: BuildMessage;
  onSuggestion: (text: string) => void;
}) {
  return (
    <div className={`chat-msg chat-msg--${msg.role}`}>
      <div className="chat-msg-bubble">{msg.content}</div>
      {msg.role === "ai" && msg.suggestions && msg.suggestions.length > 0 && (
        <div className="suggestion-chips">
          {msg.suggestions.map((s, i) => (
            <button key={i} className="suggestion-chip" onClick={() => onSuggestion(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function BuildPage() {
  const settings = useSettings();
  const hasApiKey =
    (settings.provider === "openrouter" && Boolean(settings.openrouterKey)) ||
    (settings.provider === "gemma" && Boolean(settings.gemmaKey)) ||
    Boolean(settings.apiKey);

  // ── Step / Plan state ────────────────────────────────────────────────
  const [step, setStep] = useState<BuildStep>(0);
  const [maxReached, setMaxReached] = useState<BuildStep>(0);

  const [appDesc, setAppDesc] = useState("");
  const [plan, setPlan] = useState<AppPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editFields, setEditFields] = useState({
    name: "",
    tagline: "",
    features: "",
    techApproach: "",
    complexity: "Medium",
  });

  // ── Builder state ────────────────────────────────────────────────────
  const [currentCode, setCurrentCode] = useState("");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [messages, setMessages] = useState<BuildMessage[]>([]);
  const [stepHistory, setStepHistory] = useState<Record<number, { role: string; content: string }[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [showCheckpoints, setShowCheckpoints] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const autoStarted = useRef<Set<number>>(new Set());

  // ── Helpers ──────────────────────────────────────────────────────────

  function addMsg(s: BuildStep, role: "user" | "ai", content: string, suggestions?: string[]) {
    setMessages((prev) => [
      ...prev,
      { id: uid(), step: s, role, content, suggestions, timestamp: new Date().toLocaleTimeString() },
    ]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  function saveCheckpoint(s: BuildStep, code: string, label: string) {
    setCheckpoints((prev) => [
      { id: uid(), step: s, code, timestamp: new Date().toLocaleTimeString(), label: label.slice(0, 60) },
      ...prev,
    ]);
  }

  // ── AI chat ──────────────────────────────────────────────────────────

  async function doChat(userMessage: string, targetStep?: BuildStep) {
    const s = targetStep ?? step;
    if (!userMessage.trim() || isLoading) return;
    setIsLoading(true);

    const isSilentIntro = targetStep !== undefined; // auto-start — don't show user bubble
    if (!isSilentIntro) {
      addMsg(s, "user", userMessage);
      setChatInput("");
      if (chatInputRef.current) chatInputRef.current.style.height = "auto";
    }

    const history = stepHistory[s] ?? [];
    try {
      const response = await runBuilderStep(s, plan, currentCode, history, userMessage);

      setStepHistory((prev) => ({
        ...prev,
        [s]: [
          ...history,
          { role: "user", content: userMessage },
          { role: "assistant", content: response.message },
        ],
      }));

      addMsg(s, "ai", response.message, response.suggestions);

      if (response.code) {
        setCurrentCode(response.code);
        saveCheckpoint(s, response.code, response.message);
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message === "NO_API_KEY"
            ? "No API key found. Go to Settings → AI Provider and add your key."
            : e.message
          : "Something went wrong. Please try again.";
      addMsg(s, "ai", msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step navigation ───────────────────────────────────────────────────

  function goToStep(nextStep: BuildStep) {
    setStep(nextStep);
    if (nextStep > maxReached) setMaxReached(nextStep);

    // Auto-start the step's initial AI message
    if (nextStep > 0 && !autoStarted.current.has(nextStep) && hasApiKey) {
      autoStarted.current.add(nextStep);
      const intro = STEP_INTROS[nextStep];
      if (intro) {
        // Defer to allow state to settle
        setTimeout(() => doChat(intro, nextStep as BuildStep), 100);
      }
    }
  }

  // ── Plan helpers ──────────────────────────────────────────────────────

  async function handleGeneratePlan() {
    if (!appDesc.trim() || isPlanLoading) return;
    setIsPlanLoading(true);
    try {
      const p = await generatePlan(appDesc);
      setPlan(p);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to generate plan. Check your API key in Settings.");
    } finally {
      setIsPlanLoading(false);
    }
  }

  function startEditing() {
    if (!plan) return;
    setEditFields({
      name: plan.name,
      tagline: plan.tagline,
      features: plan.features.join("\n"),
      techApproach: plan.techApproach,
      complexity: plan.estimatedComplexity,
    });
    setEditingPlan(true);
  }

  function saveEditedPlan() {
    if (!plan) return;
    setPlan({
      ...plan,
      name: editFields.name,
      tagline: editFields.tagline,
      features: editFields.features.split("\n").map((f) => f.trim()).filter(Boolean),
      techApproach: editFields.techApproach,
      estimatedComplexity: editFields.complexity as "Simple" | "Medium" | "Complex",
    });
    setEditingPlan(false);
  }

  // ── Render: Step 0 ────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="page-stack home-page">
        <header className="hero">
          <h1>What will you build?</h1>
          <p className="hero-copy">Describe your app and AI plans, prototypes, and builds it — step by step</p>
        </header>

        {!hasApiKey && (
          <div className="api-key-banner">
            <span>Add your API key in Settings to get started.</span>
            <NavLink to="/settings" className="banner-cta">Go to Settings →</NavLink>
          </div>
        )}

        <GlassPanel>
          <label htmlFor="app-desc" className="sr-only">App description</label>
          <textarea
            id="app-desc"
            className="plan-desc-input"
            placeholder='Describe your app idea… e.g. "A habit tracker with streaks, daily reminders, and a beautiful dark dashboard"'
            value={appDesc}
            rows={4}
            disabled={!hasApiKey || isPlanLoading}
            onChange={(e) => setAppDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGeneratePlan();
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
            <button
              className="run-button"
              onClick={handleGeneratePlan}
              disabled={!appDesc.trim() || isPlanLoading || !hasApiKey}
            >
              {isPlanLoading ? <Spinner /> : "✦ Generate Plan"}
            </button>
          </div>
        </GlassPanel>

        {/* ── Plan card ── */}
        {plan && !editingPlan && (
          <GlassPanel>
            <div className="plan-card">
              <div className="plan-card-header">
                <div>
                  <h2 className="plan-name">{plan.name}</h2>
                  <p className="plan-tagline">{plan.tagline}</p>
                </div>
                <span className={`status ${plan.estimatedComplexity.toLowerCase()}`}>
                  {plan.estimatedComplexity}
                </span>
              </div>

              {plan.message && <p className="plan-ai-msg">✦ {plan.message}</p>}

              <div className="plan-features">
                {plan.features.map((f, i) => (
                  <span key={i} className="plan-feature-chip">{f}</span>
                ))}
              </div>

              {plan.techApproach && (
                <p className="plan-approach">⚙ {plan.techApproach}</p>
              )}

              {plan.questions && plan.questions.length > 0 && (
                <div className="plan-questions">
                  <p className="plan-questions-label">AI asks:</p>
                  {plan.questions.map((q, i) => (
                    <p key={i} className="plan-question">💬 {q}</p>
                  ))}
                </div>
              )}

              <div className="plan-actions">
                <button className="text-button" onClick={handleGeneratePlan} disabled={isPlanLoading}>
                  {isPlanLoading ? <Spinner /> : "✦ Regenerate"}
                </button>
                <button className="text-button" onClick={startEditing}>✎ Edit plan</button>
                <button className="run-button" onClick={() => goToStep(1)}>
                  Start Building →
                </button>
              </div>
            </div>
          </GlassPanel>
        )}

        {/* ── Plan editor ── */}
        {editingPlan && (
          <GlassPanel title="Edit Plan">
            <div className="plan-edit-form">
              <label>
                App Name
                <input
                  value={editFields.name}
                  onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))}
                />
              </label>
              <label>
                Tagline
                <input
                  value={editFields.tagline}
                  onChange={(e) => setEditFields((p) => ({ ...p, tagline: e.target.value }))}
                />
              </label>
              <label>
                Features (one per line)
                <textarea
                  rows={5}
                  value={editFields.features}
                  onChange={(e) => setEditFields((p) => ({ ...p, features: e.target.value }))}
                />
              </label>
              <label>
                Tech Approach
                <input
                  value={editFields.techApproach}
                  onChange={(e) => setEditFields((p) => ({ ...p, techApproach: e.target.value }))}
                />
              </label>
              <label>
                Complexity
                <select
                  value={editFields.complexity}
                  onChange={(e) => setEditFields((p) => ({ ...p, complexity: e.target.value }))}
                >
                  <option>Simple</option>
                  <option>Medium</option>
                  <option>Complex</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button className="text-button" onClick={() => setEditingPlan(false)}>Cancel</button>
              <button className="run-button" onClick={saveEditedPlan}>Save Plan</button>
            </div>
          </GlassPanel>
        )}
      </div>
    );
  }

  // ── Render: Steps 1-4 ────────────────────────────────────────────────

  const currentMessages = messages.filter((m) => m.step === step);
  const stepCheckpoints = checkpoints.filter((c) => c.step === step);

  return (
    <div className="builder-root">
      <StepBar step={step} maxReached={maxReached} onStepClick={goToStep} />

      <div className="builder-layout">
        {/* ── Chat column ── */}
        <div className="builder-chat-col">
          <div className="builder-step-header">
            <h2 className="builder-step-title">{STEP_LABELS[step]}</h2>
            <p className="builder-step-desc">{STEP_DESCRIPTIONS[step]}</p>
          </div>

          <div className="chat-messages">
            {currentMessages.length === 0 && isLoading && (
              <div className="chat-empty">AI is thinking…</div>
            )}
            {currentMessages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} onSuggestion={(s) => doChat(s)} />
            ))}
            {isLoading && (
              <div className="chat-msg chat-msg--ai">
                <div className="chat-msg-bubble chat-loading">
                  <Spinner /> <span>Building…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Checkpoints */}
          {stepCheckpoints.length > 0 && (
            <div className="checkpoint-bar">
              <button
                className="checkpoint-toggle"
                onClick={() => setShowCheckpoints((v) => !v)}
              >
                ↩ {stepCheckpoints.length} checkpoint{stepCheckpoints.length !== 1 ? "s" : ""}
                {" "}{showCheckpoints ? "▲" : "▼"}
              </button>
              {showCheckpoints && (
                <ul className="checkpoint-list">
                  {stepCheckpoints.map((cp) => (
                    <li key={cp.id} className="checkpoint-item">
                      <div>
                        <p className="checkpoint-label">{cp.label}</p>
                        <span className="checkpoint-ts">{cp.timestamp}</span>
                      </div>
                      <button
                        className="icon-btn"
                        title="Restore this checkpoint"
                        onClick={() => {
                          setCurrentCode(cp.code);
                          setShowCheckpoints(false);
                        }}
                      >
                        ↩
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={chatInputRef}
              className="chat-input"
              placeholder={
                step === 4
                  ? "Answer AI's questions or ask for changes…"
                  : "Tell AI what to do… (e.g. 'Add a dark mode toggle')"
              }
              value={chatInput}
              rows={2}
              disabled={isLoading || !hasApiKey}
              onChange={(e) => {
                setChatInput(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) doChat(chatInput);
              }}
            />
            <div className="chat-input-btns">
              <button
                className="run-button"
                onClick={() => doChat(chatInput)}
                disabled={!chatInput.trim() || isLoading || !hasApiKey}
              >
                {isLoading ? <Spinner /> : "Send"}
              </button>
              {step < 4 ? (
                <button
                  className="next-step-btn"
                  onClick={() => goToStep((step + 1) as BuildStep)}
                  disabled={!currentCode}
                  title="Move to the next step"
                >
                  {STEP_LABELS[(step + 1) as BuildStep]} →
                </button>
              ) : (
                <button
                  className="next-step-btn"
                  disabled={!currentCode}
                  onClick={() => {
                    // Download the generated HTML
                    const blob = new Blob([currentCode], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${plan?.name ?? "app"}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  ↓ Download App
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Preview column ── */}
        <div className="builder-preview-col">
          <div className="preview-header">
            <span className="preview-label">Live Preview</span>
            {currentCode && (
              <span className="preview-badge">● Running</span>
            )}
          </div>
          <LivePreview code={currentCode} />
        </div>
      </div>
    </div>
  );
}
