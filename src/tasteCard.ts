import { AXES, tokens, type Profile } from "./model";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 780;
function xml(value: string): string {
  return Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 ||
        code === 0xfffe ||
        code === 0xffff ||
        (character.length === 1 && code >= 0xd800 && code <= 0xdfff)
        ? " "
        : character;
    })
    .join("")
    .replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[character]!,
    );
}
function wrapName(name: string): string[] {
  const text = Array.from(name.trim() || "Untitled project").slice(0, 80);
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length && lines.length < 3) {
    let end = Math.min(27, remaining.length);
    const space = remaining.slice(0, end + 1).lastIndexOf(" ");
    if (end < remaining.length && space > 10) end = space;
    lines.push(remaining.slice(0, end).join(""));
    remaining = Array.from(remaining.slice(end).join("").trim());
  }
  if (remaining.length)
    lines[2] = Array.from(lines[2]).slice(0, 25).join("") + "…";
  return lines;
}

/** Only explicit style values and an optional name enter this self-contained image. */
export function tasteCardSvg(profile: Profile, includeName = true): string {
  const theme = tokens(profile.values);
  const radius = Number.parseFloat(theme["--tc-radius"]);
  const spacing = Number.parseFloat(theme["--tc-space"]);
  const title = includeName
    ? profile.name.trim() || "Untitled project"
    : "A direction of my own";
  const lines = wrapName(title);
  const titleLines = lines
    .map((line, index) => {
      const estimatedWidth = Array.from(line).reduce(
        (width, character) =>
          width +
          (character === " "
            ? 10
            : /[MW@]/.test(character)
              ? 36
              : /[A-Z]/.test(character)
                ? 28
                : (character.codePointAt(0) ?? 0) > 0x2e80
                  ? 38
                  : 22),
        0,
      );
      return `<tspan x="58" dy="${index ? 46 : 0}"${estimatedWidth > 510 ? ' textLength="510" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(line)}</tspan>`;
    })
    .join("");
  const editorial = profile.values.typography >= 50;
  const bars = AXES.map((axis, index) => {
    const y = 198 + index * 84;
    const value = profile.values[axis.id];
    return `<g><text x="690" y="${y}" font-size="18" font-weight="600">${axis.title}</text><text x="1108" y="${y}" text-anchor="end" font-size="18">${value}</text><rect x="690" y="${y + 16}" width="418" height="6" rx="3" fill="#d7e2da"/><rect x="690" y="${y + 16}" width="${(418 * value) / 100}" height="6" rx="3" fill="${theme["--tc-accent"]}"/><circle cx="${690 + (418 * value) / 100}" cy="${y + 19}" r="6" fill="${theme["--tc-accent"]}"/><text x="690" y="${y + 47}" font-size="12" fill="#52685e">${axis.low}</text><text x="1108" y="${y + 47}" font-size="12" text-anchor="end" fill="#52685e">${axis.high}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-labelledby="title description">
<title id="title">${xml(title)} — Tastecraft direction card</title><desc id="description">Five explicit style preferences, not a personality assessment. ${AXES.map((axis) => `${axis.title}: ${profile.values[axis.id]} out of 100`).join(". ")}. Motion is represented numerically in this static image.</desc>
<rect width="1200" height="780" fill="#f4f7ef"/><path d="M636 60V686" stroke="#cbd8cd"/>
<g font-family="'Segoe UI',Arial,sans-serif" fill="#24443d">
<rect x="60" y="56" width="38" height="38" rx="11" fill="#174c47"/><text x="72" y="84" font-size="29" font-weight="700" fill="white">t</text><text x="111" y="82" font-size="22" font-weight="700">Tastecraft</text><text x="1108" y="80" text-anchor="end" font-size="13" letter-spacing="2">DESIGN DIRECTION</text>
<text x="60" y="152" font-size="12" letter-spacing="2" fill="#52685e">A LITTLE MORE LIKE ME.</text>
<text x="58" y="211" font-family="${editorial ? "Georgia,serif" : "'Segoe UI',Arial,sans-serif"}" font-size="36" font-weight="${editorial ? "400" : "700"}">${titleLines}</text>
<rect x="60" y="365" width="518" height="254" rx="${radius}" fill="white" stroke="#cbd8cd"/>
<g transform="translate(${60 + spacing},${365 + spacing})"><rect width="42" height="8" rx="4" fill="${theme["--tc-accent"]}"/><text y="51" font-family="${editorial ? "Georgia,serif" : "'Segoe UI',Arial,sans-serif"}" font-size="29" font-weight="${editorial ? "400" : "600"}">Make something yours.</text><text y="83" font-size="14" fill="#52685e">Spacing. Shape. Type. A point of view.</text><rect y="112" width="188" height="46" rx="${radius}" fill="${theme["--tc-accent"]}"/><text x="18" y="141" fill="white" font-size="14">Keep the good things ↗</text></g>
${bars}
<text x="60" y="661" font-size="12" fill="#52685e">${spacing}px spacing · ${radius}px corners · ${xml(theme["--tc-duration"])} motion</text>
<path d="M60 700H1140" stroke="#cbd8cd"/><text x="60" y="738" font-size="14" font-weight="600">Your eye. Your rules.</text><text x="1140" y="738" font-size="12" text-anchor="end" fill="#52685e">Made locally with Tastecraft · github.com/alfonza1/tastecraft</text>
</g></svg>`;
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
export async function tasteCardPng(svg: string): Promise<Blob> {
  const image = new Image();
  image.src = svgDataUrl(svg);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error(
      "PNG export is unavailable in this browser. Download SVG instead.",
    );
  context.drawImage(image, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("PNG export failed. Download SVG instead.")),
      "image/png",
    ),
  );
}
