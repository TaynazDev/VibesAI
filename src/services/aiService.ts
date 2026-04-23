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
    return state?.settings ?? {};
  } catch {
    return {};
  }
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

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://vibesai.app",
      "X-Title": "VibesAI",
    },
    body: JSON.stringify({
      model,
      temperature: opts.creativity / 100,
      max_tokens: maxTokens(opts.length),
      messages: [
        { role: "system", content: buildSystemPrompt(mode, opts) },
        { role: "user", content: prompt },
      ],
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "OpenRouter request failed.");
  const content: string = json.choices[0].message.content ?? "";
  return { type: "text", content, wordCount: content.split(/\s+/).filter(Boolean).length };
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
  const provider = s.provider ?? "openai";

  if (provider === "openrouter") {
    const key = s.openrouterKey?.trim() ?? "";
    if (!key) throw new Error("NO_API_KEY");
    const model = s.openrouterModel?.trim() || "google/gemma-3-27b-it";
    return runOpenRouter(mode, prompt, opts, key, model);
  }

  if (provider === "gemma") {
    const key = s.gemmaKey?.trim() ?? "";
    if (!key) throw new Error("NO_API_KEY");
    return runGemma(mode, prompt, opts, key);
  }

  // Default: OpenAI
  const key = s.apiKey?.trim() ?? "";
  if (!key) throw new Error("NO_API_KEY");
  return runOpenAI(mode, prompt, opts, key);
}
