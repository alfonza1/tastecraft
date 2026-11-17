import { expect, it } from "vitest";
import { freshProfile, AXES } from "./model";
import { tasteCardSvg, svgDataUrl } from "./tasteCard";

it("represents every style axis with actual tokens and measurements", () => {
  const profile = freshProfile();
  const original = tasteCardSvg(profile);
  for (const axis of AXES)
    expect(
      tasteCardSvg({
        ...profile,
        values: { ...profile.values, [axis.id]: 100 },
      }),
    ).not.toBe(original);
  expect(original).toContain('width="1200" height="780"');
  expect(original).toContain("22px spacing");
  expect(original).toContain("75ms motion");
});
it("escapes markup and omits project name and evidence when requested", () => {
  const profile = {
    ...freshProfile(),
    name: '<script>alert("secret")</script>',
    history: [{ axis: "density" as const, value: 100 }],
  };
  const card = tasteCardSvg(profile);
  expect(card).not.toContain("<script>");
  expect(card).toContain("&lt;script&gt;");
  expect(card).not.toContain('"history"');
  expect(tasteCardSvg(profile, false)).not.toContain("secret");
  expect(card).not.toContain("<image");
  expect(card).not.toContain("<foreignObject");
});
it("handles long, unicode and control-character names in a safe data URL", () => {
  for (const name of [
    "W".repeat(80),
    "🎨".repeat(40),
    "<a>&\u0001\ud800\ufffe\uffff",
    "",
  ]) {
    expect(() =>
      svgDataUrl(tasteCardSvg({ ...freshProfile(), name })),
    ).not.toThrow();
  }
});
