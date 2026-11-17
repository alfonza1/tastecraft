import { describe, expect, it } from "vitest";
import {
  activeProfile,
  appendProfiles,
  createLibrary,
  importProfiles,
  LIBRARY_KEY,
  MAX_PROFILES,
  parseLibrary,
  readLibrary,
  removeProfile,
  serializeLibrary,
  writeLibrary,
} from "./library";
import { choose, freshProfile, STORAGE_KEY } from "./model";

function memoryStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
}
describe("profile library", () => {
  it("migrates a v1 profile without deleting or modifying the source", () => {
    const original = JSON.stringify(choose(freshProfile(), "corners", 100));
    const storage = memoryStorage({ [STORAGE_KEY]: original });
    const result = readLibrary(storage);
    expect(activeProfile(result.library).values.corners).toBe(100);
    expect(result.error).toBe("");
    writeLibrary(storage, result.library, result.baseline);
    expect(storage.getItem(STORAGE_KEY)).toBe(original);
    expect(readLibrary(storage).library).toEqual(result.library);
  });
  it("preserves corrupt data and fails closed", () => {
    const storage = memoryStorage({ [LIBRARY_KEY]: "broken" });
    expect(readLibrary(storage).error).toContain("not been overwritten");
    expect(storage.getItem(LIBRARY_KEY)).toBe("broken");
  });
  it("roundtrips library backups and imports legacy profiles", () => {
    const library = appendProfiles(createLibrary(), [
      choose(freshProfile(), "density", 0),
    ]);
    expect(parseLibrary(serializeLibrary(library))).toEqual(library);
    expect(importProfiles(serializeLibrary(library))).toHaveLength(2);
    expect(importProfiles(JSON.stringify(freshProfile()))).toEqual([
      freshProfile(),
    ]);
  });
  it("gives imported profiles fresh identities and preserves originals", () => {
    const base = createLibrary();
    const next = appendProfiles(base, importProfiles(serializeLibrary(base)));
    expect(next.profiles[0]).toEqual(base.profiles[0]);
    expect(next.profiles[0].id).not.toBe(next.profiles[1].id);
    expect(next.activeId).toBe(next.profiles[1].id);
  });
  it("rejects exceeding the profile limit atomically", () => {
    const base = createLibrary();
    expect(() =>
      appendProfiles(base, Array.from({ length: MAX_PROFILES }, freshProfile)),
    ).toThrow("up to 20");
    expect(base.profiles).toHaveLength(1);
  });
  it("never deletes the final profile and switches safely after deletion", () => {
    const base = createLibrary();
    expect(() => removeProfile(base, base.activeId)).toThrow("at least one");
    const next = appendProfiles(base, [freshProfile()]);
    expect(removeProfile(next, next.activeId)).toEqual(base);
  });
  it("does not overwrite a newer library from a different writer", () => {
    const storage = memoryStorage();
    const base = createLibrary();
    const first = writeLibrary(storage, base, null);
    const updated = appendProfiles(base, [freshProfile()]);
    const second = writeLibrary(storage, updated, first);
    expect(() => writeLibrary(storage, base, first)).toThrow("Another tab");
    expect(storage.getItem(LIBRARY_KEY)).toBe(second);
  });
  it("rejects duplicate identifiers, missing active profiles, oversized and invalid imports", () => {
    const base = createLibrary();
    expect(() =>
      parseLibrary(
        JSON.stringify({
          ...base,
          profiles: [...base.profiles, ...base.profiles],
        }),
      ),
    ).toThrow("unique");
    expect(() =>
      parseLibrary(JSON.stringify({ ...base, activeId: "missing" })),
    ).toThrow("missing");
    expect(() => importProfiles(" ".repeat(1_000_001))).toThrow("too large");
    expect(() => importProfiles('{"version":2,"profiles":[]}')).toThrow();
    expect(() =>
      parseLibrary(
        JSON.stringify({
          ...base,
          profiles: [{ ...base.profiles[0], profile: { bad: true } }],
        }),
      ),
    ).toThrow();
  });
  it("normalizes empty draft names in backups", () => {
    const library = createLibrary({ ...freshProfile(), name: "   " });
    expect(activeProfile(parseLibrary(serializeLibrary(library))).name).toBe(
      "Untitled project",
    );
  });
});
