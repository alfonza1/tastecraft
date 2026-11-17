import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test("exports actual local SVG and PNG taste cards with name privacy control", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      request.url().startsWith("http") &&
      !request.url().startsWith("http://127.0.0.1:4322")
    )
      external.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Make it yours" }).click();
  await page.getByLabel("Project name").fill("The quiet internet");
  await page.getByRole("slider", { name: /^Typography/ }).fill("100");
  await page.getByLabel("Shape").fill("80");
  await page
    .getByRole("button", { name: "Make a shareable taste card" })
    .click();
  const image = page.getByRole("img", { name: /Taste card showing/ });
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBe(1200);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download tastecraft.svg" }).click();
  const svg = await readFile((await (await download).path())!, "utf8");
  expect(svg).toContain("The quiet internet");
  expect(svg).toContain("18px corners");
  expect(
    await page.evaluate(
      (text) =>
        new DOMParser()
          .parseFromString(text, "image/svg+xml")
          .querySelector("parsererror") === null,
      svg,
    ),
  ).toBe(true);
  const pngDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const png = await readFile((await (await pngDownload).path())!);
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(780);
  expect(png.length).toBeGreaterThan(20_000);
  await writeFile("docs/taste-card.png", png);
  await page.screenshot({
    path: "docs/screenshot-taste-card.png",
    fullPage: true,
  });
  await page.getByLabel("Include project name on the card").uncheck();
  expect(decodeURIComponent((await image.getAttribute("src"))!)).not.toContain(
    "The quiet internet",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshot-taste-card-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("PNG failures explain the SVG fallback without breaking exports", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Make a shareable taste card" })
    .click();
  await page.getByRole("button", { name: "Download PNG" }).click();
  await expect(page.getByRole("status")).toContainText("Download SVG instead");
  await expect(
    page.getByRole("button", { name: "Download PNG" }),
  ).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download tastecraft.svg" }).click();
  expect((await download).suggestedFilename()).toBe("tastecraft.svg");
});
