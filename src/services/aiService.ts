// Real AI service — calls OpenAI APIs directly via fetch.
// API key is stored in localStorage via the app's settings state.

export type AIMode = "Generate" | "Refactor" | "Image";

export type AIOptions = {
  creativity: number;   // 0–100 → temperature 0–1
  length: "concise" | "balanced" | "expanded";
  references: boolean;
};

export type AITextResult = { type: "text"; content: string; wordCount: number };
export type AIImageResult = { type: "image"; url: string; alt: string };
export type AIResult = AITextResult | AIImageResult;

const STORAGE_KEY = "vibesai_state_v1";

function getApiKey(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    const state = JSON.parse(raw) as { settings?: { apiKey?: string } };
    return state?.settings?.apiKey?.trim() ?? "";
  } catch {
    return "";
  }
}

const lengthSystemSuffix: Record<AIOptions["length"], string> = {
  concise:  "Keep the response concise, under 200 words.",
  balanced: "Aim for a balanced response, around 300–500 words.",
  expanded: "Give a thorough, detailed response, at least 600 words.",
};

export async function runAI(
  mode: AIMode,
  prompt: string,
  opts: AIOptions
): Promise<AIResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  // ── Image (DALL-E 3) ──────────────────────────────────────────────
  if (mode === "Image") {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message ?? "Image generation failed.");
    }

    return {
      type: "image",
      url: json.data[0].url as string,
      alt: prompt.slice(0, 80),
    };
  }

  // ── Text (GPT-4o-mini) ────────────────────────────────────────────
  const systemPrompt =
    mode === "Refactor"
      ? `You are an expert editor. Improve and refactor the user's content while preserving their original intent and voice. Format your response clearly. ${lengthSystemSuffix[opts.length]}`
      : `You are a creative AI assistant. Generate high-quality, structured content based on the user's prompt. Use markdown formatting where appropriate. ${lengthSystemSuffix[opts.length]}${opts.references ? " Include relevant references and examples where helpful." : ""}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: opts.creativity / 100,
      max_tokens: opts.length === "concise" ? 400 : opts.length === "balanced" ? 900 : 1800,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? "AI request failed.");
  }

  const content: string = json.choices[0].message.content ?? "";
  return {
    type: "text",
    content,
    wordCount: content.split(/\s+/).filter(Boolean).length,
  };
}
