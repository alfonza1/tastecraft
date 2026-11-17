import { freshProfile, parseProfile, STORAGE_KEY, type Profile } from "./model";

export const LIBRARY_KEY = "tastecraft.library.v2";
export const MAX_PROFILES = 20;
export const MAX_LIBRARY_BYTES = 1_000_000;
export type SavedProfile = { id: string; profile: Profile };
export type Library = {
  version: 2;
  activeId: string;
  profiles: SavedProfile[];
};
export interface StorageAccess {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createLibrary(profile = freshProfile()): Library {
  const id = crypto.randomUUID();
  return { version: 2, activeId: id, profiles: [{ id, profile }] };
}
export function activeProfile(library: Library): Profile {
  return library.profiles.find((entry) => entry.id === library.activeId)!
    .profile;
}
export function serializeLibrary(library: Library): string {
  return JSON.stringify(
    {
      ...library,
      profiles: library.profiles.map((entry) => ({
        ...entry,
        profile: {
          ...entry.profile,
          name: entry.profile.name.trim() || "Untitled project",
        },
      })),
    },
    null,
    2,
  );
}
export function parseLibrary(text: string): Library {
  if (new TextEncoder().encode(text).length > MAX_LIBRARY_BYTES)
    throw new Error("Library is too large. Maximum size is 1 MB.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (!raw || typeof raw !== "object")
    throw new Error("Expected a Tastecraft library.");
  const source = raw as Record<string, unknown>;
  if (
    source.version !== 2 ||
    !Array.isArray(source.profiles) ||
    !source.profiles.length ||
    source.profiles.length > MAX_PROFILES
  )
    throw new Error(
      `Expected a version 2 library with 1–${MAX_PROFILES} profiles.`,
    );
  const ids = new Set<string>();
  const profiles = source.profiles.map((entry: unknown): SavedProfile => {
    if (!entry || typeof entry !== "object")
      throw new Error("Invalid library entry.");
    const item = entry as Record<string, unknown>;
    if (
      typeof item.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
      ids.has(item.id)
    )
      throw new Error("Library profile identifiers must be unique.");
    ids.add(item.id);
    return { id: item.id, profile: parseProfile(JSON.stringify(item.profile)) };
  });
  if (typeof source.activeId !== "string" || !ids.has(source.activeId))
    throw new Error("Library active profile is missing.");
  return { version: 2, activeId: source.activeId, profiles };
}
export function importProfiles(text: string): Profile[] {
  if (new TextEncoder().encode(text).length > MAX_LIBRARY_BYTES)
    throw new Error("Import is too large. Maximum size is 1 MB.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON.");
  }
  if (raw && typeof raw === "object" && "version" in raw && raw.version === 2)
    return parseLibrary(text).profiles.map((entry) => entry.profile);
  return [parseProfile(text)];
}
export function appendProfiles(library: Library, profiles: Profile[]): Library {
  if (library.profiles.length + profiles.length > MAX_PROFILES)
    throw new Error(
      `This library holds up to ${MAX_PROFILES} profiles. Export and remove a profile first.`,
    );
  const entries = profiles.map((profile) => ({
    id: crypto.randomUUID(),
    profile,
  }));
  return {
    ...library,
    activeId: entries[0]?.id ?? library.activeId,
    profiles: [...library.profiles, ...entries],
  };
}
export function removeProfile(library: Library, id: string): Library {
  if (library.profiles.length === 1)
    throw new Error("Keep at least one profile in the library.");
  const profiles = library.profiles.filter((entry) => entry.id !== id);
  return {
    ...library,
    profiles,
    activeId: library.activeId === id ? profiles[0].id : library.activeId,
  };
}
export function readLibrary(storage: StorageAccess) {
  let baseline: string | null = null;
  try {
    baseline = storage.getItem(LIBRARY_KEY);
    if (baseline !== null)
      return { library: parseLibrary(baseline), baseline, error: "" };
    const legacy = storage.getItem(STORAGE_KEY);
    return {
      library: createLibrary(legacy ? parseProfile(legacy) : undefined),
      baseline,
      error: "",
    };
  } catch {
    return {
      library: createLibrary(),
      baseline,
      error:
        "Saved data could not be loaded. It has not been overwritten. Export this session or explicitly replace browser storage.",
    };
  }
}
export function writeLibrary(
  storage: StorageAccess,
  library: Library,
  expected: string | null,
): string {
  if (storage.getItem(LIBRARY_KEY) !== expected)
    throw new Error(
      "Another tab changed this library. Saving is paused to protect both versions. Back up this tab before loading the latest library.",
    );
  const serialized = serializeLibrary(library);
  storage.setItem(LIBRARY_KEY, serialized);
  return serialized;
}
