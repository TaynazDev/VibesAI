export type BuildStep = 0 | 1 | 2 | 3 | 4;

export const STEP_LABELS: Record<number, string> = {
  0: "Plan",
  1: "Prototype",
  2: "Functionality",
  3: "Aesthetics",
  4: "Tweaking",
};

export const STEP_DESCRIPTIONS: Record<number, string> = {
  0: "Describe your app and let AI plan it out",
  1: "AI builds the initial visual prototype",
  2: "AI wires up all the functionality",
  3: "AI perfects the design and feel",
  4: "Final tweaks — AI asks, you decide",
};

export type Checkpoint = {
  id: string;
  step: BuildStep;
  code: string;
  timestamp: string;
  label: string;
};

export type BuildMessage = {
  id: string;
  step: BuildStep;
  role: "user" | "ai";
  content: string;
  suggestions?: string[];
  timestamp: string;
};

export type AppPlan = {
  name: string;
  tagline: string;
  features: string[];
  techApproach: string;
  estimatedComplexity: "Simple" | "Medium" | "Complex";
  message: string;
  questions: string[];
};

export type BuilderResponse = {
  code?: string;
  message: string;
  suggestions: string[];
};
