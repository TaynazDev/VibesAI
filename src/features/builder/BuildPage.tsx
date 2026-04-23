import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { GlassPanel } from "../../components/GlassPanel";
import { Spinner } from "../../components/Spinner";
import { generatePlan, runBuilderStep } from "../../services/builderService";
import { useAppDispatch, useProjects, useSettings } from "../../store/AppContext";
import type { AppPlan, BuildMessage, BuildStep, Checkpoint } from "./buildTypes";
import { STEP_DESCRIPTIONS, STEP_LABELS } from "./buildTypes";
import { LivePreview } from "./LivePreview";

const uid = () => Math.random().toString(36).slice(2, 10);
const BUILDER_SESSION_KEY = "va_builder_project_id";

const STEP_INTROS: Record<number, string> = {
  1: "Build the initial prototype based on the plan. Make it visually polished and modern.",
  2: "Implement all the features to make the app fully functional.",
  3: "Before changing visuals, propose exactly 3 aesthetic directions as short options. Do not apply any code yet.",
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
  const allowSuggestions = msg.step >= 2;
  return (
    <div className={`chat-msg chat-msg--${msg.role}`}>
      <div className="chat-msg-bubble">{msg.content}</div>
      {allowSuggestions && msg.role === "ai" && msg.suggestions && msg.suggestions.length > 0 && (
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
  const { id: routeProjectId } = useParams<{ id?: string }>();
  const dispatch = useAppDispatch();
  const projects = useProjects();
  const settings = useSettings();
  const hasApiKey =
    (settings.provider === "openrouter" && Boolean(settings.openrouterKey)) ||
    (settings.provider === "gemma" && Boolean(settings.gemmaKey)) ||
    Boolean(settings.apiKey);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(
    () => routeProjectId ?? sessionStorage.getItem(BUILDER_SESSION_KEY)
  );

  const builderProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId && project.builder),
    [projects, currentProjectId]
  );
  const builderSessions = useMemo(
    () => projects.filter((project) => project.builder),
    [projects]
  );

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
  const [aestheticOptions, setAestheticOptions] = useState<string[]>([]);
  const [selectedAesthetic, setSelectedAesthetic] = useState<string>("");
  const [customAesthetic, setCustomAesthetic] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const autoStarted = useRef<Set<number>>(new Set());
  const hydratedProjectId = useRef<string | null>(null);
  const lastSavedSnapshot = useRef("");

  useEffect(() => {
    if (routeProjectId && routeProjectId !== currentProjectId) {
      setCurrentProjectId(routeProjectId);
    }
  }, [currentProjectId, routeProjectId]);

  useEffect(() => {
    if (!currentProjectId) {
      sessionStorage.removeItem(BUILDER_SESSION_KEY);
      return;
    }
    sessionStorage.setItem(BUILDER_SESSION_KEY, currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    if (!builderProject?.builder || hydratedProjectId.current === builderProject.id) {
      return;
    }

    const builder = builderProject.builder;
    setStep(builder.currentStep);
    setMaxReached(builder.currentStep);
    setPlan(builder.plan);
    setCurrentCode(builder.generatedCode);
    setCheckpoints(builder.checkpoints);
    setMessages(builder.messages);
    setStepHistory(builder.stepHistory);
    setAppDesc(builder.plan ? `${builder.plan.name} — ${builder.plan.tagline}` : "");
    hydratedProjectId.current = builderProject.id;
    lastSavedSnapshot.current = JSON.stringify(builder);
  }, [builderProject]);

  useEffect(() => {
    if (!currentProjectId || !plan) {
      return;
    }

    const builder = {
      currentStep: step,
      plan,
      generatedCode: currentCode,
      checkpoints,
      messages,
      stepHistory,
    };

    const snapshot = JSON.stringify(builder);
    if (snapshot === lastSavedSnapshot.current) {
      return;
    }

    lastSavedSnapshot.current = snapshot;
    dispatch({
      type: "PROJECT_BUILDER_SAVE",
      id: currentProjectId,
      name: plan.name,
      status: currentCode || step > 0 ? "Active" : "Draft",
      builder,
    });
  }, [checkpoints, currentCode, currentProjectId, dispatch, messages, plan, step, stepHistory]);

  useEffect(() => {
    if (aestheticOptions.length > 0) {
      return;
    }
    const latestAestheticMsg = [...messages]
      .reverse()
      .find((message) => message.step === 3 && message.role === "ai" && message.suggestions?.length);
    if (!latestAestheticMsg?.suggestions) {
      return;
    }
    setAestheticOptions(latestAestheticMsg.suggestions.slice(0, 3));
  }, [aestheticOptions.length, messages]);

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
    const waitingForAestheticChoice = s === 3 && !selectedAesthetic;
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
      dispatch({
        type: "NOTIFICATION_ADD",
        notification: {
          title: `${STEP_LABELS[s]} updated`,
          detail: response.message.slice(0, 88),
          timestamp: "just now",
          unread: true,
          kind: "builder",
        },
      });

      if (waitingForAestheticChoice) {
        const options = (response.suggestions ?? []).filter(Boolean).slice(0, 3);
        setAestheticOptions(
          options.length > 0
            ? options
            : [
                "Clean Glass Minimal",
                "Bold Neon Futuristic",
                "Soft Editorial Premium",
              ]
        );
        return;
      }

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

    if (nextStep !== 3) {
      setSelectedAesthetic("");
      setCustomAesthetic("");
      setAestheticOptions([]);
    }

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
      const nextProjectId = currentProjectId ?? uid();
      if (!currentProjectId) {
        setCurrentProjectId(nextProjectId);
      }
      hydratedProjectId.current = nextProjectId;
      lastSavedSnapshot.current = "";
      autoStarted.current = new Set();
      setStep(0);
      setMaxReached(0);
      setPlan(p);
      setCurrentCode("");
      setCheckpoints([]);
      setMessages([]);
      setStepHistory({});
      dispatch({
        type: "NOTIFICATION_ADD",
        notification: {
          title: `Plan ready for ${p.name}`,
          detail: "Saved to Projects automatically.",
          timestamp: "just now",
          unread: true,
          kind: "builder",
        },
      });
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

  function applyChosenAesthetic(aesthetic: string) {
    if (!aesthetic.trim()) {
      return;
    }
    setSelectedAesthetic(aesthetic);
    void doChat(`Apply this exact aesthetic direction to the app: ${aesthetic}. Keep all functionality intact.`, 3);
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

        {builderSessions.length > 0 && (
          <GlassPanel title="Recent Builder Sessions">
            <div className="builder-session-grid">
              {builderSessions.slice(0, 6).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`builder-session-card${project.id === currentProjectId ? " builder-session-card--active" : ""}`}
                  onClick={() => setCurrentProjectId(project.id)}
                >
                  <div className="builder-session-top">
                    <strong>{project.name}</strong>
                    <span className="badge muted">{project.updatedAt}</span>
                  </div>
                  <p>
                    {project.builder?.plan?.tagline ?? "Saved builder session"}
                  </p>
                  <div className="project-list-builder-row">
                    <span className="badge">Step {((project.builder?.currentStep ?? 0) + 1).toString()}</span>
                    <NavLink
                      to={`/builder/${project.id}`}
                      className="project-inline-link"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Open
                    </NavLink>
                  </div>
                </button>
              ))}
            </div>
          </GlassPanel>
        )}

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
            {currentProjectId && plan && (
              <div className="builder-project-pill">
                <span>Saved to Projects</span>
                <NavLink to={`/projects/${currentProjectId}`} className="builder-project-link">
                  {plan.name}
                </NavLink>
              </div>
            )}
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
            {step === 3 && (
              <div className="aesthetic-picker">
                <p className="aesthetic-picker-title">
                  Pick an aesthetic direction before generation
                </p>

                {aestheticOptions.length > 0 ? (
                  <div className="aesthetic-options">
                    {aestheticOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`aesthetic-option${selectedAesthetic === option ? " active" : ""}`}
                        onClick={() => applyChosenAesthetic(option)}
                        disabled={isLoading}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => doChat("Propose exactly 3 aesthetics before applying visuals.", 3)}
                    disabled={isLoading}
                  >
                    Generate 3 Aesthetic Options
                  </button>
                )}

                <div className="aesthetic-custom-row">
                  <input
                    className="search-input"
                    placeholder="Something else…"
                    value={customAesthetic}
                    onChange={(e) => setCustomAesthetic(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => applyChosenAesthetic(customAesthetic)}
                    disabled={!customAesthetic.trim() || isLoading}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            <textarea
              ref={chatInputRef}
              className="chat-input"
              placeholder={
                step === 4
                  ? "Answer AI's questions or ask for changes…"
                  : step === 3 && !selectedAesthetic
                    ? "Pick an aesthetic first, then refine it here…"
                  : "Tell AI what to do… (e.g. 'Add a dark mode toggle')"
              }
              value={chatInput}
              rows={2}
              disabled={isLoading || !hasApiKey || (step === 3 && !selectedAesthetic)}
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
