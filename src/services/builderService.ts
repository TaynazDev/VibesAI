// AI service for the VibesAI app-builder workflow.
// Handles plan generation and per-step code generation via OpenAI / OpenRouter / Gemma.

import type { AppPlan, BuilderResponse, BuildStep } from "../features/builder/buildTypes";

const STORAGE_KEY = "vibesai_state_v1";

type StoredSettings = {
  apiKey?: string;
  provider?: "openai" | "openrouter" | "gemma";
  openrouterKey?: string;
  openrouterModel?: string;
  gemmaKey?: string;
};

function getSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const state = JSON.parse(raw) as { settings?: StoredSettings };
    return state.settings ?? {};
  } catch {
    return {};
  }
}

// ── JSON extraction ──────────────────────────────────────────────────────

function extractJSON(text: string): Record<string, unknown> | null {
  if (!text) return null;
  try { return JSON.parse(text) as Record<string, unknown>; } catch { /* fall through */ }
  const cbMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cbMatch) { try { return JSON.parse(cbMatch[1]) as Record<string, unknown>; } catch { /* fall through */ } }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]) as Record<string, unknown>; } catch { /* fall through */ } }
  return null;
}

// ── Provider calls ───────────────────────────────────────────────────────

type Msg = { role: string; content: string };

async function callOpenAI(messages: Msg[], apiKey: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content ?? "";
}

async function streamOpenAI(
  messages: Msg[],
  apiKey: string,
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 8000,
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
        const delta = parsed.choices[0]?.delta?.content ?? "";
        if (delta) { full += delta; onChunk(delta); }
      } catch { /* skip malformed SSE lines */ }
    }
  }
  return full;
}

async function streamOpenRouter(
  messages: Msg[],
  apiKey: string,
  model: string,
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://vibesai.app",
      "X-Title": "VibesAI Builder",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 8000, stream: true }),
  });
  if (!res.ok) throw new Error(await res.text());
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as { choices: { delta: { content?: string } }[] };
        const delta = parsed.choices[0]?.delta?.content ?? "";
        if (delta) { full += delta; onChunk(delta); }
      } catch { /* skip malformed SSE lines */ }
    }
  }
  return full;
}

async function callOpenRouter(messages: Msg[], apiKey: string, model: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://vibesai.app",
      "X-Title": "VibesAI Builder",
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 8000 }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content ?? "";
}

async function callGemma(systemPrompt: string, history: Msg[], apiKey: string, signal?: AbortSignal): Promise<string> {
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
      }),
    },
  );
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function normalizeBuilderError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.name === "AbortError") return error;
    if (error.message.toLowerCase().includes("failed to fetch")) {
      return new Error("NETWORK_ERROR");
    }
    return error;
  }
  return new Error("Builder request failed.");
}

function isRetriableBuilderError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("network_error") ||
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("no_api_key") ||
    m.includes("no api key") ||
    m.includes("unauthorized") ||
    m.includes("invalid api key") ||
    m.includes("invalid authentication") ||
    m.includes("rate limit") ||
    m.includes("too many requests") ||
    m.includes("overloaded") ||
    m.includes("401") ||
    m.includes("403") ||
    m.includes("429") ||
    m.includes("500") ||
    m.includes("502") ||
    m.includes("503") ||
    m.includes("504")
  );
}

async function callAI(systemPrompt: string, history: Msg[], signal?: AbortSignal): Promise<string> {
  const s = getSettings();
  const provider = s.provider ?? "openai";
  const messages: Msg[] = [{ role: "system", content: systemPrompt }, ...history];

  const providerOrder = ([provider, "openai", "openrouter", "gemma"] as const)
    .filter((p, i, arr) => arr.indexOf(p) === i);

  let sawUsableKey = false;
  let lastError: Error | null = null;

  for (const candidate of providerOrder) {
    try {
      if (candidate === "openai") {
        const key = s.apiKey?.trim() ?? "";
        if (!key) continue;
        sawUsableKey = true;
        return await callOpenAI(messages, key, signal);
      }

      if (candidate === "openrouter") {
        const key = s.openrouterKey?.trim() ?? "";
        if (!key) continue;
        sawUsableKey = true;
        return await callOpenRouter(messages, key, s.openrouterModel ?? "google/gemma-3-27b-it", signal);
      }

      const key = s.gemmaKey?.trim() ?? "";
      if (!key) continue;
      sawUsableKey = true;
      return await callGemma(systemPrompt, history, key, signal);
    } catch (error: unknown) {
      const e = normalizeBuilderError(error);
      if (e.name === "AbortError") throw e;
      if (!isRetriableBuilderError(e.message)) {
        throw e;
      }
      lastError = e;
    }
  }

  if (!sawUsableKey) {
    throw new Error("NO_API_KEY");
  }
  throw lastError ?? new Error("Builder provider request failed.");
}

// ── System prompts ───────────────────────────────────────────────────────

const JSON_RULE = "Return ONLY valid JSON — no markdown, no code fences, no extra text. Use single quotes for HTML attributes.";

function planSystemPrompt(): string {
  return `You are an expert app architect and product designer. The user describes an app idea.
Create a detailed plan and return ONLY valid JSON with this EXACT structure:
{"name":"App name","tagline":"Catchy one-liner","features":["Feature 1","Feature 2","Feature 3","Feature 4","Feature 5"],"techApproach":"How to build it with HTML/CSS/JS","estimatedComplexity":"Medium","message":"Enthusiastic acknowledgment of the idea","questions":["Smart clarifying question 1","Smart clarifying question 2"]}
estimatedComplexity must be exactly one of: Simple, Medium, Complex.`;
}

function stepSystemPrompt(step: BuildStep, plan: AppPlan | null, currentCode: string): string {
  const planCtx = plan
    ? `\nAPP: ${plan.name} — ${plan.tagline}\nFEATURES: ${plan.features.join(", ")}\nAPPROACH: ${plan.techApproach}`
    : "";
  const codeCtx = currentCode
    ? `\n\nCURRENT CODE (update this — do not start from scratch):\n${currentCode}`
    : "";

  if (step === 1) {
    return `You are an expert frontend developer building a web app prototype.${planCtx}
Generate a complete standalone HTML file with all CSS and JS embedded inline.
Requirements: modern polished design, cohesive color scheme, responsive, realistic placeholder content, smooth hover states.
${JSON_RULE}
{"code":"<!DOCTYPE html>...FULL HTML...","message":"2-3 sentences describing what you built","suggestions":["Want me to add X?","Should I change Y?","Want to try Z?"]}`;
  }

  if (step === 2) {
    return `You are a JavaScript expert making a web app fully functional.${planCtx}${codeCtx}
Make ALL features work: form submissions (use localStorage/in-memory state), navigation, data management, error/empty states.
Keep existing styles exactly as-is.
${JSON_RULE}
{"code":"<!DOCTYPE html>...FULL HTML...","message":"What functionality you implemented","suggestions":["Want me to add X?","Should I add Y?","Want to try Z?"]}`;
  }

  if (step === 3) {
    return `You are a world-class UI/UX designer polishing a web app.${planCtx}${codeCtx}
Make it visually stunning: refine color palette, add subtle CSS animations/transitions, perfect spacing and typography, add micro-interactions.
Keep all existing JavaScript functionality exactly as-is.
${JSON_RULE}
{"code":"<!DOCTYPE html>...FULL HTML...","message":"Visual improvements you made","suggestions":["Want a different color scheme?","Should I animate X?","Want to adjust the layout?"]}`;
  }

  if (step === 4) {
    return `You are finalizing a web app with a keen eye for detail.${planCtx}${codeCtx}
Be proactive: suggest improvements the user might not have thought of. Make precise targeted tweaks.
If you changed code, include the full updated HTML. If only responding/asking, omit the "code" key.
${JSON_RULE}
{"code":"<!DOCTYPE html>... (only if changed)","message":"Your response or question","suggestions":["Follow-up 1","Follow-up 2","Follow-up 3"]}`;
  }

  return planSystemPrompt();
}

// ── Streaming callAI ─────────────────────────────────────────────────────

async function callAIStream(
  systemPrompt: string,
  history: Msg[],
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const s = getSettings();
  const provider = s.provider ?? "openai";
  const messages: Msg[] = [{ role: "system", content: systemPrompt }, ...history];

  const providerOrder = ([provider, "openai", "openrouter", "gemma"] as const)
    .filter((p, i, arr) => arr.indexOf(p) === i);

  let sawUsableKey = false;
  let lastError: Error | null = null;

  for (const candidate of providerOrder) {
    try {
      if (candidate === "openai") {
        const key = s.apiKey?.trim() ?? "";
        if (!key) continue;
        sawUsableKey = true;
        return await streamOpenAI(messages, key, onChunk, signal);
      }
      if (candidate === "openrouter") {
        const key = s.openrouterKey?.trim() ?? "";
        if (!key) continue;
        sawUsableKey = true;
        return await streamOpenRouter(messages, key, s.openrouterModel ?? "google/gemma-3-27b-it", onChunk, signal);
      }
      // Gemma doesn't support SSE the same way — fall back to non-streaming
      const key = s.gemmaKey?.trim() ?? "";
      if (!key) continue;
      sawUsableKey = true;
      const result = await callGemma(systemPrompt, history, key, signal);
      onChunk(result);
      return result;
    } catch (error: unknown) {
      const e = normalizeBuilderError(error);
      if (e.name === "AbortError") throw e;
      if (!isRetriableBuilderError(e.message)) throw e;
      lastError = e;
    }
  }

  if (!sawUsableKey) throw new Error("NO_API_KEY");
  throw lastError ?? new Error("Builder provider request failed.");
}

// ── Public API ───────────────────────────────────────────────────────────

export async function generatePlan(description: string): Promise<AppPlan> {
  const raw = await callAI(planSystemPrompt(), [{ role: "user", content: description }]);
  const parsed = extractJSON(raw);
  if (!parsed?.name) {
    return {
      name: "My App",
      tagline: description.slice(0, 80),
      features: ["Core feature 1", "Core feature 2", "Core feature 3"],
      techApproach: "HTML, CSS, and vanilla JavaScript",
      estimatedComplexity: "Medium",
      message: raw || "Here is your app plan!",
      questions: ["Who is the primary user?", "What is the single most important feature?"],
    };
  }
  return parsed as unknown as AppPlan;
}

export async function runBuilderStep(
  step: BuildStep,
  plan: AppPlan | null,
  currentCode: string,
  history: Msg[],
  userMessage: string,
  signal?: AbortSignal,
): Promise<BuilderResponse> {
  const sysPrompt = stepSystemPrompt(step, plan, currentCode);
  const fullHistory = [...history, { role: "user", content: userMessage }];
  const raw = await callAI(sysPrompt, fullHistory, signal);
  const parsed = extractJSON(raw);
  if (!parsed) {
    return {
      message: raw || "Couldn't generate a response. Please try again.",
      suggestions: ["Try again", "Simplify the request"],
    };
  }
  return {
    code: typeof parsed.code === "string" && parsed.code.includes("<") ? parsed.code : undefined,
    message: typeof parsed.message === "string" ? parsed.message : "Done!",
    suggestions: Array.isArray(parsed.suggestions) ? (parsed.suggestions as string[]) : [],
  };
}

export async function runBuilderStepStream(
  step: BuildStep,
  plan: AppPlan | null,
  currentCode: string,
  history: Msg[],
  userMessage: string,
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<BuilderResponse> {
  const sysPrompt = stepSystemPrompt(step, plan, currentCode);
  const fullHistory = [...history, { role: "user", content: userMessage }];
  const raw = await callAIStream(sysPrompt, fullHistory, onChunk, signal);
  const parsed = extractJSON(raw);
  if (!parsed) {
    return {
      message: raw || "Couldn't generate a response. Please try again.",
      suggestions: ["Try again", "Simplify the request"],
    };
  }
  return {
    code: typeof parsed.code === "string" && parsed.code.includes("<") ? parsed.code : undefined,
    message: typeof parsed.message === "string" ? parsed.message : "Done!",
    suggestions: Array.isArray(parsed.suggestions) ? (parsed.suggestions as string[]) : [],
  };
}
