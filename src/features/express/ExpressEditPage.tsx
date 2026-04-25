import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { Spinner } from "../../components/Spinner";
import { runBuilderStep } from "../../services/builderService";
import { useAppDispatch, useProjects, useSettings } from "../../store/AppContext";
import type { AppPlan, BuildMessage, Checkpoint } from "../builder/buildTypes";
import { LivePreview } from "../builder/LivePreview";

const uid = () => Math.random().toString(36).slice(2, 10);

export function ExpressEditPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const projects = useProjects();
  const settings = useSettings();
  const hasApiKey =
    (settings.provider === "openrouter" && Boolean(settings.openrouterKey)) ||
    (settings.provider === "gemma" && Boolean(settings.gemmaKey)) ||
    Boolean(settings.apiKey);

  const project = useMemo(
    () => projects.find((entry) => entry.id === id),
    [id, projects]
  );

  const [plan, setPlan] = useState<AppPlan | null>(project?.builder?.plan ?? null);
  const [currentCode, setCurrentCode] = useState(project?.builder?.generatedCode ?? "");
  const [messages, setMessages] = useState<BuildMessage[]>(project?.builder?.messages ?? []);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(project?.builder?.checkpoints ?? []);
  const [stepHistory, setStepHistory] = useState<Record<number, { role: string; content: string }[]>>(
    project?.builder?.stepHistory ?? {}
  );

  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewReloadNonce, setPreviewReloadNonce] = useState(0);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project?.builder) {
      return;
    }
    setPlan(project.builder.plan);
    setCurrentCode(project.builder.generatedCode);
    setMessages(project.builder.messages);
    setCheckpoints(project.builder.checkpoints);
    setStepHistory(project.builder.stepHistory);
  }, [project]);

  useEffect(() => {
    if (!id || !plan) {
      return;
    }

    dispatch({
      type: "PROJECT_BUILDER_SAVE",
      id,
      name: plan.name,
      status: currentCode ? "Active" : "Draft",
      builder: {
        currentStep: 4,
        plan,
        generatedCode: currentCode,
        checkpoints,
        messages,
        stepHistory,
      },
    });
  }, [checkpoints, currentCode, dispatch, id, messages, plan, stepHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isLoading, messages]);

  async function doEdit(message: string) {
    const userMessage = message.trim();
    if (!userMessage || isLoading || !plan) {
      return;
    }

    const history = stepHistory[4] ?? [];
    const userBubble: BuildMessage = {
      id: uid(),
      step: 4,
      role: "user",
      content: userMessage,
      timestamp: new Date().toLocaleTimeString(),
    };
    const baseMessages = [...messages, userBubble];
    setMessages(baseMessages);
    setChatInput("");
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
    }

    setIsLoading(true);
    try {
      const response = await runBuilderStep(4, plan, currentCode, history, userMessage);

      const aiBubble: BuildMessage = {
        id: uid(),
        step: 4,
        role: "ai",
        content: response.message,
        suggestions: response.suggestions,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages([...baseMessages, aiBubble]);

      setStepHistory((prev) => ({
        ...prev,
        4: [...history, { role: "user", content: userMessage }, { role: "assistant", content: response.message }],
      }));

      if (response.code) {
        const nextCode = response.code;
        setCurrentCode(nextCode);
        setCheckpoints((prev) => [
          {
            id: uid(),
            step: 4,
            code: nextCode,
            timestamp: new Date().toLocaleTimeString(),
            label: response.message.slice(0, 60),
          },
          ...prev,
        ]);
      }
    } catch (e: unknown) {
      const fallback =
        e instanceof Error
          ? e.message === "NO_API_KEY"
            ? "No API key found. Go to Settings and add one to continue edits."
            : e.message
          : "Edit failed. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          step: 4,
          role: "ai",
          content: fallback,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!project?.builder || !plan) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <h1>Express Edit</h1>
          <p>No express build session found for this project.</p>
        </header>
        <NavLink to="/" className="text-button">Return Home</NavLink>
      </div>
    );
  }

  const editMessages = messages.filter((msg) => msg.step === 4);

  return (
    <div className="builder-root">
      <div className="builder-layout">
        <div className="builder-chat-col">
          <div className="builder-step-header">
            <h2 className="builder-step-title">Express Edit</h2>
            <p className="builder-step-desc">One-pass build completed. Use AI to make targeted changes.</p>
            <div className="builder-project-pill">
              <span>Project</span>
              <NavLink to={`/projects/${project.id}`} className="builder-project-link">
                {plan.name}
              </NavLink>
            </div>
          </div>

          <div className="chat-messages">
            {editMessages.length === 0 && !isLoading && (
              <div className="chat-empty">Try: "Improve spacing and add a cleaner hero section."</div>
            )}
            {editMessages.map((msg) => (
              <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
                <div className="chat-msg-bubble">{msg.content}</div>
                {msg.role === "ai" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="suggestion-chips">
                    {msg.suggestions.map((suggestion, i) => (
                      <button
                        key={`${msg.id}-${i}`}
                        type="button"
                        className="suggestion-chip"
                        onClick={() => void doEdit(suggestion)}
                        disabled={isLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat-msg chat-msg--ai">
                <div className="chat-msg-bubble chat-loading">
                  <Spinner /> <span>Applying edits…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              ref={chatInputRef}
              className="chat-input"
              placeholder={
                hasApiKey
                  ? "Ask for targeted edits (layout, UX, content, styling, behavior)…"
                  : "Add an API key in Settings to continue editing…"
              }
              value={chatInput}
              rows={2}
              disabled={!hasApiKey || isLoading}
              onChange={(event) => {
                setChatInput(event.target.value);
                const el = event.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  void doEdit(chatInput);
                }
              }}
            />
            <div className="chat-input-btns">
              <button
                type="button"
                className="run-button"
                onClick={() => void doEdit(chatInput)}
                disabled={!chatInput.trim() || isLoading || !hasApiKey}
              >
                {isLoading ? <Spinner /> : "Send"}
              </button>
              <button
                type="button"
                className="next-step-btn"
                disabled={!currentCode}
                onClick={() => {
                  const blob = new Blob([currentCode], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${plan.name}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download App
              </button>
            </div>
          </div>
        </div>

        <div className="builder-preview-col">
          <div className="preview-header">
            <span className="preview-label">Live Preview</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              {currentCode && <span className="preview-badge">● Running</span>}
              <button
                type="button"
                className="text-button"
                onClick={() => setPreviewReloadNonce((n) => n + 1)}
                disabled={!currentCode}
                title="Reload preview"
              >
                Reload
              </button>
            </div>
          </div>
          <LivePreview code={currentCode} reloadNonce={previewReloadNonce} />
        </div>
      </div>
    </div>
  );
}
