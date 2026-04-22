// Mock AI service — swap callFn bodies for real API calls when ready.

export type AIMode = "Generate" | "Refactor" | "Image";

export type AIOptions = {
  creativity: number;        // 0–100
  length: "concise" | "balanced" | "expanded";
  references: boolean;
};

export type AITextResult = { type: "text"; content: string; wordCount: number };
export type AIImageResult = { type: "image"; url: string; alt: string };
export type AIResult = AITextResult | AIImageResult;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const charLimitByLength = { concise: 600, balanced: 1400, expanded: 2800 };

function buildGenerate(prompt: string, opts: AIOptions): string {
  const topic = prompt.trim().split(/\s+/).slice(0, 6).join(" ");
  const tone =
    opts.creativity > 70 ? "exploratory and imaginative" :
    opts.creativity < 30 ? "precise and structured" :
    "clear and balanced";

  return [
    `# ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
    "",
    `> Generated with a **${tone}** tone — ${opts.length} depth.`,
    "",
    "## Overview",
    "",
    prompt.length > 10
      ? prompt
      : "Your idea has been expanded into a structured output.",
    "",
    "## Key Points",
    "",
    "- Clarity leads the structure, supporting detail reinforces the main idea",
    "- Tone is calibrated to your chosen creativity level",
    opts.references
      ? "- References and context provided where relevant"
      : "- Self-contained output — no external dependencies",
    "",
    opts.length !== "concise"
      ? [
          `## ${opts.length === "expanded" ? "Extended Analysis" : "Summary"}`,
          "",
          "This output was generated using a mock provider. Connect a real API key in Settings → Advanced to get full AI-powered results. The interface, parameters, and result format will stay exactly the same.",
        ].join("\n")
      : "",
  ]
    .filter((line) => line !== null)
    .join("\n")
    .slice(0, charLimitByLength[opts.length]);
}

function buildRefactor(prompt: string): string {
  return [
    "## Refactored Version",
    "",
    "**Original intent preserved.** The following improvements were applied:",
    "",
    "### Changes Made",
    "1. Tightened opening phrasing for directness",
    "2. Replaced passive voice with active constructions",
    "3. Grouped related ideas into cohesive paragraphs",
    "4. Removed redundant qualifiers",
    "",
    "### Revised Output",
    "",
    prompt.length > 20
      ? `${prompt.slice(0, 200).trim()}${prompt.length > 200 ? "…\n\n_[Full refactor available with a real API key connected in Settings → Advanced]_" : ""}`
      : "Provide a longer prompt for a meaningful refactor suggestion.",
  ].join("\n");
}

function buildImageUrl(prompt: string): string {
  // Deterministic seed per prompt so the same prompt → same image preview
  const seed =
    Math.abs(
      prompt
        .split("")
        .reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    ) % 1000;
  return `https://picsum.photos/seed/${seed}/900/520`;
}

export async function runAI(
  mode: AIMode,
  prompt: string,
  opts: AIOptions
): Promise<AIResult> {
  await delay(900 + Math.random() * 700);

  if (mode === "Image") {
    return { type: "image", url: buildImageUrl(prompt), alt: prompt.slice(0, 80) };
  }

  const content = mode === "Refactor" ? buildRefactor(prompt) : buildGenerate(prompt, opts);
  return { type: "text", content, wordCount: content.split(/\s+/).filter(Boolean).length };
}
