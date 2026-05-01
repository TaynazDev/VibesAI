// Real AI service — supports OpenAI, OpenRouter, and Google AI Studio (Gemma).
// All keys are stored in localStorage via the app's settings state.

export type AIMode = "Generate" | "Refactor" | "Image";

export type AIOptions = {
  creativity: number;   // 0–100 → temperature 0–2
  length: "concise" | "balanced" | "expanded";
  references: boolean;
};

export type AITextResult = { type: "text"; content: string; wordCount: number };
export type AIImageResult = { type: "image"; url: string; alt: string };
export type AIResult = AITextResult | AIImageResult;

const STORAGE_KEY = "vibesai_state_v1";

const OPENROUTER_FALLBACK_MODELS = [
  "google/gemma-2-9b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

type StoredSettings = {
  apiKey?: string;
  provider?: "openai" | "openrouter" | "gemma";
  providerRouting?: "single" | "hybrid";
  experimentalFallback?: boolean;
  fallbackOrder?: Array<"openai" | "openrouter" | "gemma">;
  openrouterKey?: string;
  openrouterModel?: string;
  openrouterFallbackModels?: string[];
  openaiFallbackKeys?: string[];
  openrouterFallbackKeys?: string[];
  gemmaFallbackKeys?: string[];
  gemmaKey?: string;
};

function getSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const state = JSON.parse(raw) as { settings?: StoredSettings };
    return state?.settings ?? {};
  } catch {
    return {};
  }
}

function openRouterReferer(): string {
  try {
    return window.location.origin;
  } catch {
    return "https://vibesai.app";
  }
}

function buildOpenRouterModelOrder(primaryModel: string): string[] {
  return [primaryModel, ...OPENROUTER_FALLBACK_MODELS]
    .map((m) => m.trim())
    .filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);
}

function buildOpenRouterModelOrderWithExtras(primaryModel: string, extras?: string[]): string[] {
  return [primaryModel, ...(extras ?? []), ...OPENROUTER_FALLBACK_MODELS]
    .map((m) => m.trim())
    .filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);
}

function cleanedKeys(primary: string | undefined, extras?: string[]): string[] {
  return [primary ?? "", ...(extras ?? [])]
    .map((v) => v.trim())
    .filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i);
}

function buildProviderOrder(settings: StoredSettings): Array<"openai" | "openrouter" | "gemma"> {
  const selected = settings.provider ?? "openai";
  const defaultOrder: Array<"openai" | "openrouter" | "gemma"> = [selected, "openai", "openrouter", "gemma"]
    .filter((p, i, arr) => arr.indexOf(p) === i) as Array<"openai" | "openrouter" | "gemma">;

  const fallbackEnabled = settings.providerRouting === "hybrid" || settings.experimentalFallback;
  if (!fallbackEnabled) {
    return [selected];
  }

  const configured = (settings.fallbackOrder ?? []).filter(
    (p): p is "openai" | "openrouter" | "gemma" => p === "openai" || p === "openrouter" || p === "gemma"
  );
  if (settings.experimentalFallback && configured.length > 0) {
    return [selected, ...configured].filter((p, i, arr) => arr.indexOf(p) === i);
  }
  return defaultOrder;
}

function isOpenRouterEndpointPolicyError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("no endpoints available") ||
    m.includes("guardrail") ||
    m.includes("data policy") ||
    m.includes("privacy")
  );
}

const lengthSystemSuffix: Record<AIOptions["length"], string> = {
  concise:  "Keep the response concise, under 200 words.",
  balanced: "Aim for a balanced response, around 300–500 words.",
  expanded: "Give a thorough, detailed response, at least 600 words.",
};

function buildSystemPrompt(mode: AIMode, opts: AIOptions): string {
  return mode === "Refactor"
    ? `You are an expert editor. Improve and refactor the user's content while preserving their original intent and voice. Format your response clearly. ${lengthSystemSuffix[opts.length]}`
    : `You are a creative AI assistant. Generate high-quality, structured content based on the user's prompt. Use markdown formatting where appropriate. ${lengthSystemSuffix[opts.length]}${opts.references ? " Include relevant references and examples where helpful." : ""}`;
}

function maxTokens(length: AIOptions["length"]): number {
  return length === "concise" ? 400 : length === "balanced" ? 900 : 1800;
}

// ── OpenAI ────────────────────────────────────────────────────────────────
async function runOpenAI(mode: AIMode, prompt: string, opts: AIOptions, apiKey: string): Promise<AIResult> {
  if (mode === "Image") {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? "Image generation failed.");
    return { type: "image", url: json.data[0].url as string, alt: prompt.slice(0, 80) };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: opts.creativity / 100,
      max_tokens: maxTokens(opts.length),
      messages: [
        { role: "system", content: buildSystemPrompt(mode, opts) },
        { role: "user", content: prompt },
      ],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "OpenAI request failed.");
  const content: string = json.choices[0].message.content ?? "";
  return { type: "text", content, wordCount: content.split(/\s+/).filter(Boolean).length };
}

// ── OpenRouter ────────────────────────────────────────────────────────────
// OpenRouter uses the OpenAI-compatible chat completions API.
// Image generation is not supported — falls back to error.
async function runOpenRouter(mode: AIMode, prompt: string, opts: AIOptions, key: string, model: string): Promise<AIResult> {
  if (mode === "Image") {
    throw new Error("Image generation requires an OpenAI key. Switch provider to OpenAI for this mode.");
  }

  const modelCandidates = buildOpenRouterModelOrder(model);
  for (let i = 0; i < modelCandidates.length; i++) {
    const candidateModel = modelCandidates[i];
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": openRouterReferer(),
        "X-Title": "VibesAI",
      },
      body: JSON.stringify({
        model: candidateModel,
        temperature: opts.creativity / 100,
        max_tokens: maxTokens(opts.length),
        messages: [
          { role: "system", content: buildSystemPrompt(mode, opts) },
          { role: "user", content: prompt },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg = (json?.error?.message ?? "OpenRouter request failed.") as string;
      if (i < modelCandidates.length - 1 && isOpenRouterEndpointPolicyError(errMsg)) {
        continue;
      }
      throw new Error(errMsg);
    }
    const content: string = json.choices[0].message.content ?? "";
    return { type: "text", content, wordCount: content.split(/\s+/).filter(Boolean).length };
  }

  throw new Error("OpenRouter request failed.");
}

async function runOpenRouterWithExtras(
  mode: AIMode,
  prompt: string,
  opts: AIOptions,
  key: string,
  model: string,
  extraModels?: string[],
): Promise<AIResult> {
  if (mode === "Image") {
    throw new Error("Image generation requires an OpenAI key. Switch provider to OpenAI for this mode.");
  }

  const modelCandidates = buildOpenRouterModelOrderWithExtras(model, extraModels);
  for (let i = 0; i < modelCandidates.length; i++) {
    const candidateModel = modelCandidates[i];
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": openRouterReferer(),
        "X-Title": "VibesAI",
      },
      body: JSON.stringify({
        model: candidateModel,
        temperature: opts.creativity / 100,
        max_tokens: maxTokens(opts.length),
        messages: [
          { role: "system", content: buildSystemPrompt(mode, opts) },
          { role: "user", content: prompt },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg = (json?.error?.message ?? "OpenRouter request failed.") as string;
      if (i < modelCandidates.length - 1 && isOpenRouterEndpointPolicyError(errMsg)) {
        continue;
      }
      throw new Error(errMsg);
    }
    const content: string = json.choices[0].message.content ?? "";
    return { type: "text", content, wordCount: content.split(/\s+/).filter(Boolean).length };
  }

  throw new Error("OpenRouter request failed.");
}

// ── Google AI Studio (Gemma) ──────────────────────────────────────────────
// Uses the Gemini API which supports Gemma models.
// https://ai.google.dev/gemma/docs/gemma_chat
async function runGemma(mode: AIMode, prompt: string, opts: AIOptions, key: string): Promise<AIResult> {
  if (mode === "Image") {
    throw new Error("Image generation requires an OpenAI key. Switch provider to OpenAI for this mode.");
  }

  const model = "gemma-3-27b-it";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(mode, opts) }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.creativity / 100,
        maxOutputTokens: maxTokens(opts.length),
      },
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? "Gemma request failed.");
  }
  const content: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!content) throw new Error("Gemma returned an empty response.");
  return { type: "text", content, wordCount: content.split(/\s+/).filter(Boolean).length };
}

// ── Public entry point ────────────────────────────────────────────────────
export async function runAI(mode: AIMode, prompt: string, opts: AIOptions): Promise<AIResult> {
  const s = getSettings();
  const providerOrder = buildProviderOrder(s);

  let sawUsableKey = false;
  let lastError: Error | null = null;

  for (const candidate of providerOrder) {
    try {
      if (candidate === "openai") {
        const keys = cleanedKeys(s.apiKey, s.experimentalFallback ? s.openaiFallbackKeys : undefined);
        if (keys.length === 0) continue;
        for (const key of keys) {
          try {
            sawUsableKey = true;
            return await runOpenAI(mode, prompt, opts, key);
          } catch (err: unknown) {
            const e = err instanceof Error ? err : new Error("AI request failed.");
            const m = e.message.toLowerCase();
            const retriableAuthError =
              m.includes("no_api_key") ||
              m.includes("no api key") ||
              m.includes("unauthorized") ||
              m.includes("invalid api key") ||
              m.includes("invalid authentication") ||
              m.includes("401") ||
              m.includes("403") ||
              m.includes("429") ||
              m.includes("overloaded") ||
              m.includes("too many requests");
            if (!retriableAuthError) throw e;
            lastError = e;
          }
        }
        continue;
      }

      if (candidate === "openrouter") {
        const keys = cleanedKeys(s.openrouterKey, s.experimentalFallback ? s.openrouterFallbackKeys : undefined);
        if (keys.length === 0) continue;
        for (const key of keys) {
          try {
            sawUsableKey = true;
            const model = s.openrouterModel?.trim() || "google/gemma-3-27b-it";
            return await runOpenRouterWithExtras(
              mode,
              prompt,
              opts,
              key,
              model,
              s.experimentalFallback ? s.openrouterFallbackModels : undefined,
            );
          } catch (err: unknown) {
            const e = err instanceof Error ? err : new Error("AI request failed.");
            const m = e.message.toLowerCase();
            const retriableAuthError =
              m.includes("no_api_key") ||
              m.includes("no api key") ||
              m.includes("unauthorized") ||
              m.includes("invalid api key") ||
              m.includes("invalid authentication") ||
              m.includes("no endpoints available") ||
              m.includes("guardrail") ||
              m.includes("data policy") ||
              m.includes("privacy") ||
              m.includes("401") ||
              m.includes("403") ||
              m.includes("429") ||
              m.includes("overloaded") ||
              m.includes("too many requests");
            if (!retriableAuthError) throw e;
            lastError = e;
          }
        }
        continue;
      }

      const keys = cleanedKeys(s.gemmaKey, s.experimentalFallback ? s.gemmaFallbackKeys : undefined);
      if (keys.length === 0) continue;
      for (const key of keys) {
        try {
          sawUsableKey = true;
          return await runGemma(mode, prompt, opts, key);
        } catch (err: unknown) {
          const e = err instanceof Error ? err : new Error("AI request failed.");
          const m = e.message.toLowerCase();
          const retriableAuthError =
            m.includes("no_api_key") ||
            m.includes("no api key") ||
            m.includes("unauthorized") ||
            m.includes("invalid api key") ||
            m.includes("invalid authentication") ||
            m.includes("401") ||
            m.includes("403") ||
            m.includes("429") ||
            m.includes("overloaded") ||
            m.includes("too many requests");
          if (!retriableAuthError) throw e;
          lastError = e;
        }
      }
      continue;
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error("AI request failed.");
      const m = e.message.toLowerCase();
      const retriableAuthError =
        m.includes("no_api_key") ||
        m.includes("no api key") ||
        m.includes("unauthorized") ||
        m.includes("invalid api key") ||
        m.includes("invalid authentication") ||
        m.includes("401") ||
        m.includes("403");
      if (!retriableAuthError) {
        throw e;
      }
      lastError = e;
    }
  }

  if (!sawUsableKey) {
    throw new Error("NO_API_KEY");
  }
  throw lastError ?? new Error("All configured AI providers failed.");
}
