import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import { GlassPanel } from "../../components/GlassPanel";
import { Spinner } from "../../components/Spinner";
import { VoiceFloatingOverlay } from "../../components/VoiceFloatingOverlay";
import { AICriticPassModal } from "../../components/AICriticPassModal";
import { ReleaseReadinessModal } from "../../components/ReleaseReadinessModal";
import { TimeTravelPanel } from "../../components/TimeTravelPanel";
import { generatePlan, runBuilderStepStream } from "../../services/builderService";
import { useAppDispatch, useProjects, useSettings } from "../../store/AppContext";
import { useAudioVisualizer } from "../../hooks/useAudioVisualizer";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import type { AppPlan, BuildMessage, BuildStep, Checkpoint } from "./buildTypes";
import { STEP_DESCRIPTIONS, STEP_LABELS } from "./buildTypes";
import { DiffView } from "./DiffView";
import { LivePreview } from "./LivePreview";

const uid = () => Math.random().toString(36).slice(2, 10);
const BUILDER_SESSION_KEY = "va_builder_project_id";

const STEP_INTROS: Record<number, string> = {
  1: "Build the initial prototype based on the plan. Make it visually polished and modern.",
  2: "Implement all the features to make the app fully functional.",
  3: "Before changing visuals, propose exactly 3 aesthetic directions as short options. Do not apply any code yet.",
  4: "Analyse the current app carefully and ask me 3 smart, proactive questions about what to finalize or improve.",
};

const EXPRESS_STEP_LABELS: Record<number, string> = {
  0: "Plan",
  1: "Finishing Touches",
};

const EXPRESS_STEP_DESCRIPTIONS: Record<number, string> = {
  0: "Describe your app and let AI plan it quickly",
  1: "AI builds the app fast, then you refine and edit",
};

// ── Sub-components ────────────────────────────────────────────────────────

function StepBar({
  step,
  maxReached,
  steps,
  labels,
  onStepClick,
}: {
  step: BuildStep;
  maxReached: BuildStep;
  steps: BuildStep[];
  labels: Record<number, string>;
  onStepClick: (s: BuildStep) => void;
}) {
  return (
    <div className="step-bar" role="tablist" aria-label="Builder steps">
      {steps.map((s, i) => {
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
            title={labels[s]}
          >
            <span className="step-dot-num">{isCompleted ? "✓" : i + 1}</span>
            <span className="step-dot-name">{labels[s]}</span>
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
  const location = useLocation();
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
  const [builderMode, setBuilderMode] = useState<"standard" | "express">("standard");
  const [expressError, setExpressError] = useState<string | null>(null);
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
  const [previewReloadNonce, setPreviewReloadNonce] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const [prevCode, setPrevCode] = useState("");
  const [streamingMsg, setStreamingMsg] = useState<string | null>(null);
  const [voiceExpanded, setVoiceExpanded] = useState(false);
  const [showCriticPass, setShowCriticPass] = useState(false);
  const [showTimeTravelPanel, setShowTimeTravelPanel] = useState(false);
  const [showReleaseScore, setShowReleaseScore] = useState(false);
  const streamingMsgRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const autoStarted = useRef<Set<number>>(new Set());
  const hydratedProjectId = useRef<string | null>(null);
  const lastSavedSnapshot = useRef("");
  const mountedRef = useRef(true);
  const activeRequestRef = useRef<{ controller: AbortController; step: BuildStep } | null>(null);
  const stepRef = useRef(step);
  const planRef = useRef(plan);
  const currentCodeRef = useRef(currentCode);
  const checkpointsRef = useRef(checkpoints);
  const messagesRef = useRef(messages);
  const stepHistoryRef = useRef(stepHistory);
  const currentProjectIdRef = useRef<string | null>(currentProjectId);
  const voiceBaseInputRef = useRef("");
  const appDescRef = useRef(appDesc);
  const chatInputValueRef = useRef(chatInput);
  const modeSteps = builderMode === "express" ? ([0, 1] as BuildStep[]) : ([0, 1, 2, 3, 4] as BuildStep[]);
  const modeStepLabels = builderMode === "express" ? EXPRESS_STEP_LABELS : STEP_LABELS;
  const modeStepDescriptions = builderMode === "express" ? EXPRESS_STEP_DESCRIPTIONS : STEP_DESCRIPTIONS;

  const { isListening, isSpeaking, supported: sttSupported, toggle: toggleMic } = useSpeechToText({
    onListeningChange: (listening) => {
      if (listening) {
        voiceBaseInputRef.current = stepRef.current === 0
          ? appDescRef.current.trim()
          : chatInputValueRef.current.trim();
      }
    },
    onInterimTranscript: (text) => {
      const base = voiceBaseInputRef.current;
      if (!text) {
        if (stepRef.current === 0) {
          setAppDesc(base);
        } else {
          setChatInput(base);
        }
        return;
      }
      const next = base ? `${base} ${text}` : text;
      if (stepRef.current === 0) {
        setAppDesc(next);
      } else {
        setChatInput(next);
      }
    },
    onFinalTranscript: (text) => {
      const base = voiceBaseInputRef.current;
      const next = base ? `${base} ${text}` : text;
      voiceBaseInputRef.current = next.trim();
      if (stepRef.current === 0) {
        setAppDesc(next.trim());
      } else {
        setChatInput(next.trim());
      }
    },
  });

  const { audioData, start: startAudioViz, stop: stopAudioViz } = useAudioVisualizer({
    onSilenceTimeout: () => {
      // Auto-close the pill after prolonged silence
      console.log("Prolonged silence detected, closing voice input");
      toggleMic(); // Close the voice input
    },
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Start/stop audio visualizer with speech recognition ─────────────
  useEffect(() => {
    if (isListening) {
      startAudioViz();
    } else {
      stopAudioViz();
    }
  }, [isListening, startAudioViz, stopAudioViz]);

  // ── Fresh-start when Home is re-clicked while already on "/" ─────────
  const freshToken = (location.state as { fresh?: number } | null)?.fresh;
  useEffect(() => {
    if (!freshToken) return;
    // Abort any in-flight request
    if (activeRequestRef.current) {
      activeRequestRef.current.controller.abort();
      activeRequestRef.current = null;
    }
    // Clear session project tracking
    sessionStorage.removeItem(BUILDER_SESSION_KEY);
    setCurrentProjectId(null);
    hydratedProjectId.current = null;
    lastSavedSnapshot.current = "";
    autoStarted.current = new Set();
    // Reset all builder state
    setStep(0);
    setMaxReached(0);
    setAppDesc("");
    setPlan(null);
    setIsPlanLoading(false);
    setBuilderMode("standard");
    setExpressError(null);
    setEditingPlan(false);
    setEditFields({ name: "", tagline: "", features: "", techApproach: "", complexity: "Medium" });
    setCurrentCode("");
    setCheckpoints([]);
    setMessages([]);
    setStepHistory({});
    setIsLoading(false);
    setChatInput("");
    setShowCheckpoints(false);
    setAestheticOptions([]);
    setSelectedAesthetic("");
    setCustomAesthetic("");
    setPreviewReloadNonce(0);
    setShowDiff(false);
    setPrevCode("");
    setVoiceExpanded(false);
    setStreamingMsg(null);
    streamingMsgRef.current = null;
    // Clear stale location state so navigating back doesn't re-trigger
    window.history.replaceState({ ...window.history.state, usr: { fresh: null } }, "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshToken]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    planRef.current = plan;
  }, [plan]);
  useEffect(() => {
    currentCodeRef.current = currentCode;
  }, [currentCode]);
  useEffect(() => {
    checkpointsRef.current = checkpoints;
  }, [checkpoints]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    stepHistoryRef.current = stepHistory;
  }, [stepHistory]);
  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  useEffect(() => {
    appDescRef.current = appDesc;
  }, [appDesc]);

  useEffect(() => {
    chatInputValueRef.current = chatInput;
  }, [chatInput]);

  useEffect(() => {
    if (!isListening) {
      voiceBaseInputRef.current = step === 0 ? appDesc.trim() : chatInput.trim();
    }
  }, [appDesc, chatInput, isListening, step]);

  useEffect(() => {
    if (isListening || isSpeaking) {
      setVoiceExpanded(true);
      return;
    }
    const t = window.setTimeout(() => setVoiceExpanded(false), 140);
    return () => window.clearTimeout(t);
  }, [isListening, isSpeaking]);

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

  // ── AI chat ──────────────────────────────────────────────────────────

  async function doChat(userMessage: string, targetStep?: BuildStep) {
    const s = targetStep ?? step;
    if (!userMessage.trim() || isLoading) return;
    setIsLoading(true);
    const controller = new AbortController();
    activeRequestRef.current = { controller, step: s };

    const isSilentIntro = targetStep !== undefined; // auto-start — don't show user bubble
    const userMsgEntry: BuildMessage | null = isSilentIntro
      ? null
      : {
          id: uid(),
          step: s,
          role: "user",
          content: userMessage,
          timestamp: new Date().toLocaleTimeString(),
        };
    const baseMessages = messagesRef.current;

    if (!isSilentIntro) {
      setMessages([...baseMessages, userMsgEntry as BuildMessage]);
      setChatInput("");
      if (chatInputRef.current) chatInputRef.current.style.height = "auto";
    }

    const history = stepHistoryRef.current[s] ?? [];
    const waitingForAestheticChoice = s === 3 && !selectedAesthetic;
    try {
      // ── Streaming: accumulate raw buffer, extract partial message for live display ──
      let rawBuf = "";
      const onChunk = (delta: string) => {
        rawBuf += delta;
        // Try to extract the partial message field for a live preview
        const msgStart = rawBuf.indexOf('"message":"');
        if (msgStart !== -1) {
          const after = rawBuf.slice(msgStart + 11);
          // Unescape and show up to the first unescaped closing quote
          const cleaned = after.replace(/\\n/g, " ").replace(/\\"/g, '"').replace(/\\t/g, " ");
          const closeIdx = cleaned.search(/(?<!\\)"/);
          const partial = closeIdx === -1 ? cleaned : cleaned.slice(0, closeIdx);
          streamingMsgRef.current = partial;
          if (mountedRef.current) setStreamingMsg(partial);
        }
      };

      const response = await runBuilderStepStream(
        s,
        planRef.current,
        currentCodeRef.current,
        history,
        userMessage,
        onChunk,
        controller.signal,
      );

      // Clear streaming state once complete
      streamingMsgRef.current = null;
      if (mountedRef.current) setStreamingMsg(null);

      const nextStepHistory: Record<number, { role: string; content: string }[]> = {
        ...stepHistoryRef.current,
        [s]: [
          ...history,
          { role: "user", content: userMessage },
          { role: "assistant", content: response.message },
        ],
      };
      const aiMsg: BuildMessage = {
        id: uid(),
        step: s,
        role: "ai",
        content: response.message,
        suggestions: response.suggestions,
        timestamp: new Date().toLocaleTimeString(),
      };
      const nextMessages = [
        ...baseMessages,
        ...(userMsgEntry ? [userMsgEntry] : []),
        aiMsg,
      ];

      let nextCode = currentCodeRef.current;
      let nextCheckpoints = checkpointsRef.current;

      if (mountedRef.current) {
        setStepHistory(nextStepHistory);
      }

      if (mountedRef.current) {
        setMessages(nextMessages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      }
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
        if (mountedRef.current) {
          setAestheticOptions(
            options.length > 0
              ? options
              : [
                  "Clean Glass Minimal",
                  "Bold Neon Futuristic",
                  "Soft Editorial Premium",
                ]
          );
        }

        if (currentProjectIdRef.current && planRef.current) {
          dispatch({
            type: "PROJECT_BUILDER_SAVE",
            id: currentProjectIdRef.current,
            name: planRef.current.name,
            status: nextCode || stepRef.current > 0 ? "Active" : "Draft",
            builder: {
              currentStep: stepRef.current,
              plan: planRef.current,
              generatedCode: nextCode,
              checkpoints: nextCheckpoints,
              messages: nextMessages,
              stepHistory: nextStepHistory,
            },
          });
        }
        return;
      }

      if (response.code) {
        nextCode = response.code;
        nextCheckpoints = [
          {
            id: uid(),
            step: s,
            code: response.code,
            timestamp: new Date().toLocaleTimeString(),
            label: response.message.slice(0, 60),
          },
          ...checkpointsRef.current,
        ];
        if (mountedRef.current) {
          setPrevCode(currentCodeRef.current);
          setCurrentCode(response.code);
          setCheckpoints(nextCheckpoints);
          setShowDiff(false); // reset diff toggle on new code
        }
      }

      if (currentProjectIdRef.current && planRef.current) {
        dispatch({
          type: "PROJECT_BUILDER_SAVE",
          id: currentProjectIdRef.current,
          name: planRef.current.name,
          status: nextCode || stepRef.current > 0 ? "Active" : "Draft",
          builder: {
            currentStep: stepRef.current,
            plan: planRef.current,
            generatedCode: nextCode,
            checkpoints: nextCheckpoints,
            messages: nextMessages,
            stepHistory: nextStepHistory,
          },
        });

        // Create snapshot for time travel
        if (nextCode) {
          dispatch({
            type: "SNAPSHOT_CREATE",
            projectId: currentProjectIdRef.current,
            label: `Step ${stepRef.current} - ${new Date().toLocaleTimeString()}`,
            builder: {
              currentStep: stepRef.current,
              plan: planRef.current,
              generatedCode: nextCode,
              checkpoints: nextCheckpoints,
              messages: nextMessages,
              stepHistory: nextStepHistory,
            },
          });
        }
      }
    } catch (e: unknown) {
      streamingMsgRef.current = null;
      if (mountedRef.current) setStreamingMsg(null);
      if (e instanceof Error && e.name === "AbortError") {
        if (mountedRef.current) {
          addMsg(s, "ai", "Generation cancelled for this stage.");
        }
        return;
      }
      const msg =
        e instanceof Error
          ? e.message === "NO_API_KEY"
            ? "No API key found. Go to Settings → AI Provider and add your key."
            : e.message === "NETWORK_ERROR"
              ? "Network request failed while contacting AI. Try again or switch provider in Settings."
            : e.message
          : "Something went wrong. Please try again.";
      if (mountedRef.current) {
        addMsg(s, "ai", msg);
      }
    } finally {
      if (activeRequestRef.current?.controller === controller) {
        activeRequestRef.current = null;
      }
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  // ── Step navigation ───────────────────────────────────────────────────

  function goToStep(nextStep: BuildStep) {
    if (builderMode === "express" && nextStep > 1) {
      return;
    }

    if (nextStep !== step && activeRequestRef.current) {
      activeRequestRef.current.controller.abort();
      activeRequestRef.current = null;
      setIsLoading(false);
    }

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
      const intro =
        builderMode === "express"
          ? "Build the complete app in one fast pass from this plan, then ask me for finishing touches I want to apply."
          : STEP_INTROS[nextStep];
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

  async function handleExpressBuild() {
    if (!appDesc.trim() || isPlanLoading) return;
    setExpressError(null);
    setIsPlanLoading(true);
    try {
      const p = await generatePlan(appDesc);
      const nextProjectId = currentProjectId ?? uid();
      if (!currentProjectId) {
        setCurrentProjectId(nextProjectId);
      }
      hydratedProjectId.current = nextProjectId;
      lastSavedSnapshot.current = "";
      setPlan(p);
      setCurrentCode("");
      setCheckpoints([]);
      setMessages([]);
      setStepHistory({});
      setSelectedAesthetic("");
      setCustomAesthetic("");
      setAestheticOptions([]);
      autoStarted.current = new Set();
      setStep(1);
      setMaxReached(1);

      dispatch({
        type: "PROJECT_BUILDER_SAVE",
        id: nextProjectId,
        name: p.name,
        status: "Draft",
        builder: {
          currentStep: 1,
          plan: p,
          generatedCode: "",
          checkpoints: [],
          messages: [],
          stepHistory: {},
        },
      });

      setTimeout(() => {
        void doChat("Build the complete app in one fast pass from this plan, then suggest a few finishing touch edits.", 1);
      }, 80);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message === "NO_API_KEY"
            ? "No API key found. Go to Settings and add at least one provider key before running Express Mode."
            : e.message === "NETWORK_ERROR"
              ? "Express Mode hit a network error while contacting AI. Please retry, or switch provider in Settings."
              : e.message
          : "Express build failed. Check your API key in Settings.";
      setExpressError(msg);
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

  const voiceDisabled = step === 0
    ? isPlanLoading
    : isLoading || (builderMode === "standard" && step === 3 && !selectedAesthetic);

  function openVoicePill() {
    if (voiceDisabled) {
      return;
    }
    setVoiceExpanded(true);
    if (!isListening) {
      toggleMic();
    }
  }

  function onVoicePillClick() {
    if (voiceDisabled) {
      return;
    }
    if (isListening) {
      toggleMic();
      setVoiceExpanded(false);
      return;
    }
    toggleMic();
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

        {expressError && (
          <div className="api-key-banner" role="alert" style={{ borderColor: "rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.12)" }}>
            <span>{expressError}</span>
            <button type="button" className="banner-cta" onClick={() => setExpressError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <GlassPanel>
          <div className="mode-row" style={{ marginBottom: "0.65rem" }}>
            <button
              type="button"
              className={builderMode === "standard" ? "chip active" : "chip"}
              onClick={() => setBuilderMode("standard")}
            >
              Standard Mode
            </button>
            <button
              type="button"
              className={builderMode === "express" ? "chip active" : "chip"}
              onClick={() => setBuilderMode("express")}
            >
              Express Mode
            </button>
          </div>

          <label htmlFor="app-desc" className="sr-only">App description</label>
          <textarea
            id="app-desc"
            className="plan-desc-input"
            placeholder='Describe your app idea… e.g. "A habit tracker with streaks, daily reminders, and a beautiful dark dashboard"'
            value={appDesc}
            rows={4}
            disabled={isPlanLoading}
            onChange={(e) => setAppDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                if (builderMode === "express") {
                  void handleExpressBuild();
                } else {
                  void handleGeneratePlan();
                }
              }
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
            {sttSupported ? (
              <div className={`voice-control${voiceExpanded ? " voice-control--expanded" : ""}`}>
                <button
                  type="button"
                  className="voice-mic-icon"
                  onClick={openVoicePill}
                  disabled={voiceDisabled}
                  aria-label="Open voice input"
                  title="Voice input"
                >
                  🎙
                </button>
              </div>
            ) : <span />}
            <button
              className="run-button"
              onClick={builderMode === "express" ? handleExpressBuild : handleGeneratePlan}
              disabled={!appDesc.trim() || isPlanLoading || !hasApiKey}
            >
              {isPlanLoading ? <Spinner /> : builderMode === "express" ? "⚡ Build In One Pass" : "✦ Generate Plan"}
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
                <button
                  className="run-button"
                  onClick={() => {
                    if (builderMode === "express") {
                      void handleExpressBuild();
                    } else {
                      goToStep(1);
                    }
                  }}
                >
                  {builderMode === "express" ? "Start Express →" : "Start Building →"}
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
        
        <VoiceFloatingOverlay
          isListening={isListening}
          isSpeaking={isSpeaking}
          onPillClick={onVoicePillClick}
          disabled={voiceDisabled}
          frequencies={audioData.frequencies}
        />
      </div>
    );
  }

  // ── Render: Steps 1-4 ────────────────────────────────────────────────

  const currentMessages = messages.filter((m) => m.step === step);
  const stepCheckpoints = checkpoints.filter((c) => c.step === step);

  return (
    <div className="builder-root">
      <StepBar
        step={step}
        maxReached={maxReached}
        steps={modeSteps}
        labels={modeStepLabels}
        onStepClick={goToStep}
      />

      <div className="builder-layout">
        {/* ── Chat column ── */}
        <div className="builder-chat-col">
          <div className="builder-step-header">
            <h2 className="builder-step-title">{modeStepLabels[step]}</h2>
            <p className="builder-step-desc">{modeStepDescriptions[step]}</p>
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
                <div className={`chat-msg-bubble${streamingMsg ? " chat-streaming" : " chat-loading"}`}>
                  {streamingMsg
                    ? <span className="chat-streaming-text">{streamingMsg}<span className="chat-cursor">▌</span></span>
                    : <><Spinner /> <span>Building…</span></>
                  }
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
            {builderMode === "standard" && step === 3 && (
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
                builderMode === "express"
                  ? "Ask for finishing touches, edits, and improvements…"
                  : step === 4
                  ? "Answer AI's questions or ask for changes…"
                  : step === 3 && !selectedAesthetic
                    ? "Pick an aesthetic first, then refine it here…"
                  : "Tell AI what to do… (e.g. 'Add a dark mode toggle')"
              }
              value={chatInput}
              rows={2}
              disabled={isLoading || (builderMode === "standard" && step === 3 && !selectedAesthetic)}
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
              {sttSupported && (
                <div className={`voice-control${voiceExpanded ? " voice-control--expanded" : ""}`}>
                  <button
                    type="button"
                    className="voice-mic-icon"
                    onClick={openVoicePill}
                    disabled={voiceDisabled}
                    aria-label="Open voice input"
                    title="Voice input"
                  >
                    🎙
                  </button>
                </div>
              )}
              <button
                className="run-button"
                onClick={() => doChat(chatInput)}
                disabled={!chatInput.trim() || isLoading || !hasApiKey}
              >
                {isLoading ? <Spinner /> : "Send"}
              </button>
              {builderMode === "standard" && step < 4 ? (
                <button
                  className="next-step-btn"
                  onClick={() => goToStep((step + 1) as BuildStep)}
                  disabled={!currentCode}
                  title="Move to the next step"
                >
                  {modeStepLabels[(step + 1) as BuildStep]} →
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
            <span className="preview-label">{showDiff ? "Diff View" : "Live Preview"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              {currentCode && !showDiff && (
                <span className="preview-badge">● Running</span>
              )}
              <button
                type="button"
                className="text-button"
                onClick={() => setShowCriticPass(true)}
                title="Run AI Critic Pass"
              >
                🤖 Critic
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setShowTimeTravelPanel(!showTimeTravelPanel)}
                title="Time Travel snapshots"
              >
                ⏱️ Snapshots
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setShowReleaseScore(true)}
                title="Release Readiness Score"
              >
                📋 Release
              </button>
              {prevCode && currentCode && (
                <button
                  type="button"
                  className={`text-button${showDiff ? " active" : ""}`}
                  onClick={() => setShowDiff((v) => !v)}
                  title="Toggle before/after diff"
                >
                  {showDiff ? "← Preview" : "⊟ Diff"}
                </button>
              )}
              {!showDiff && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setPreviewReloadNonce((n) => n + 1)}
                  disabled={!currentCode}
                  title="Reload preview"
                >
                  Reload
                </button>
              )}
            </div>
          </div>
          {showDiff
            ? <DiffView oldCode={prevCode} newCode={currentCode} />
            : <LivePreview code={currentCode} reloadNonce={previewReloadNonce} />}
        </div>
      </div>
      
      <VoiceFloatingOverlay
        isListening={isListening}
        isSpeaking={isSpeaking}
        onPillClick={onVoicePillClick}
        disabled={voiceDisabled}
        frequencies={audioData.frequencies}
      />

      <TimeTravelPanel
        projectId={currentProjectId || ""}
        isOpen={showTimeTravelPanel}
        onClose={() => setShowTimeTravelPanel(false)}
      />

      {showCriticPass && (
        <AICriticPassModal
          projectId={currentProjectId || ""}
          builder={builderProject?.builder}
          onClose={() => setShowCriticPass(false)}
        />
      )}

      {showReleaseScore && (
        <ReleaseReadinessModal
          projectId={currentProjectId || ""}
          onClose={() => setShowReleaseScore(false)}
        />
      )}
    </div>
  );
}
