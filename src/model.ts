export const AXES = [
  {
    id: "density",
    title: "Breathing room",
    low: "Compact",
    high: "Spacious",
    question: "How much room feels right?",
    hint: "Compare the spacing. Everything else stays the same.",
  },
  {
    id: "typography",
    title: "Typography",
    low: "Utility",
    high: "Editorial",
    question: "How should your words feel?",
    hint: "Compare the heading style: practical sans or expressive serif.",
  },
  {
    id: "corners",
    title: "Shape",
    low: "Precise",
    high: "Rounded",
    question: "Sharp edges or softer shapes?",
    hint: "Look at the cards, buttons, and checkboxes.",
  },
  {
    id: "contrast",
    title: "Accent",
    low: "Quiet",
    high: "Bold",
    question: "How much emphasis is enough?",
    hint: "Compare restrained accents with a stronger color presence.",
  },
  {
    id: "motion",
    title: "Motion",
    low: "Still",
    high: "Expressive",
    question: "How should interactions move?",
    hint: "Try the task checkboxes and Add note. Hover over the buttons.",
  },
] as const;
export type Axis = (typeof AXES)[number]["id"];
export type Values = Record<Axis, number>;
export type Choice = { axis: Axis; value: number | null };
export type Profile = {
  version: 1;
  name: string;
  values: Values;
  history: Choice[];
};
export const STORAGE_KEY = "tastecraft.profile.v1";
export const MAX_HISTORY = 100;
export const MAX_IMPORT_BYTES = 100_000;
export const DEFAULT_VALUES: Values = {
  density: 50,
  typography: 0,
  corners: 50,
  contrast: 50,
  motion: 25,
};
export function freshProfile(): Profile {
  return {
    version: 1,
    name: "My next project",
    values: { ...DEFAULT_VALUES },
    history: [],
  };
}
export function choose(
  profile: Profile,
  axis: Axis,
  value: number | null,
): Profile {
  const history = [...profile.history, { axis, value }].slice(-MAX_HISTORY);
  const choices = history.filter(
    (item) => item.axis === axis && item.value !== null,
  );
  const average = choices.length
    ? Math.round(
        choices.reduce((sum, item) => sum + item.value!, 0) / choices.length,
      )
    : profile.values[axis];
  return {
    ...profile,
    history,
    values: { ...profile.values, [axis]: average },
  };
}
export function tokens(values: Values): Record<string, string> {
  return {
    "--tc-space": `${Math.round(12 + values.density * 0.2)}px`,
    "--tc-radius": `${Math.round(values.corners * 0.22)}px`,
    "--tc-font-heading":
      values.typography >= 50
        ? 'Georgia, "Times New Roman", serif'
        : '"Segoe UI", system-ui, sans-serif',
    "--tc-font-body": '"Segoe UI", system-ui, sans-serif',
    "--tc-accent": values.contrast >= 50 ? "#146551" : "#42675c",
    "--tc-accent-soft": values.contrast >= 50 ? "#d0eddf" : "#edf2ef",
    "--tc-duration": `${Math.round(values.motion * 3)}ms`,
    "--tc-lift": `${(values.motion * 0.04).toFixed(1)}px`,
    "--tc-text": "#203a34",
    "--tc-muted": "#52675f",
    "--tc-surface": "#ffffff",
    "--tc-border": "#d2ded6",
  };
}
export function parseProfile(text: string): Profile {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES)
    throw new Error("Profile is too large. Maximum size is 100 KB.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(
      "This file is not valid JSON. Choose a Tastecraft profile export.",
    );
  }
  if (!raw || typeof raw !== "object")
    throw new Error("Expected a Tastecraft profile object.");
  const p = raw as Record<string, unknown>;
  if (
    p.version !== 1 ||
    typeof p.name !== "string" ||
    p.name.length > 80 ||
    !p.name.trim() ||
    !p.values ||
    typeof p.values !== "object" ||
    !Array.isArray(p.history) ||
    p.history.length > MAX_HISTORY
  )
    throw new Error(
      "Unsupported or incomplete profile. Use a version 1 Tastecraft profile.",
    );
  const values = {} as Values;
  for (const { id } of AXES) {
    const value = (p.values as Record<string, unknown>)[id];
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    )
      throw new Error(`Invalid ${id} value. Expected a number from 0 to 100.`);
    values[id] = value;
  }
  const history: Choice[] = p.history.map((item: unknown) => {
    if (!item || typeof item !== "object")
      throw new Error("Invalid choice history.");
    const entry = item as Record<string, unknown>;
    if (
      !AXES.some((axis) => axis.id === entry.axis) ||
      (entry.value !== null &&
        (typeof entry.value !== "number" ||
          !Number.isFinite(entry.value) ||
          entry.value < 0 ||
          entry.value > 100))
    )
      throw new Error("Invalid choice history.");
    return { axis: entry.axis as Axis, value: entry.value as number | null };
  });
  return { version: 1, name: p.name.trim(), values, history };
}
export function loadProfile(): { profile: Profile; warning: string } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return {
      profile: stored ? parseProfile(stored) : freshProfile(),
      warning: "",
    };
  } catch {
    return {
      profile: freshProfile(),
      warning:
        "Your saved profile could not be loaded. A fresh profile is open; your export files are unaffected.",
    };
  }
}
