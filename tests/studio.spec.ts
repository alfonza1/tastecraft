import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("chooses a direction, interacts with live previews, refines, exports and restores", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const preview = page.getByRole("region", { name: "Option A preview" });
  await preview.getByRole("checkbox").nth(1).check();
  await expect(preview.getByText("2 / 3")).toBeVisible();
  await preview.getByRole("button", { name: "+ Add note" }).click();
  await preview
    .getByRole("textbox", { name: "Note text" })
    .fill("Keep the details intentional");
  await preview.getByRole("button", { name: "Save", exact: true }).click();
  await expect(preview.getByText("Keep the details intentional")).toBeVisible();
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "I prefer B" }).click();
  await expect(page.getByText("5 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Make it yours" }).click();
  await page.getByLabel("Project name").fill("Workshop");
  await page.getByLabel("Shape").fill("32");
  await page.getByRole("button", { name: "Take it with you" }).click();
  await expect(page.getByLabel("Agent skill preview")).toContainText(
    "Workshop",
  );
  await page.getByRole("button", { name: "Profile JSON", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download tastecraft.json" }).click();
  const downloaded = await download;
  expect(downloaded.suggestedFilename()).toBe("tastecraft.json");
  const profile = JSON.parse(
    await readFile((await downloaded.path())!, "utf8"),
  );
  expect(profile.name).toBe("Workshop");
  expect(profile.values.corners).toBe(32);
  expect(profile.history).toHaveLength(5);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Workshop", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Start fresh" })
    .click();
  await expect(page.getByText("0 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("5 of 5")).toBeVisible();
  expect(errors).toEqual([]);
});
test("storage errors are visible and do not prevent exporting; no external assets", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4322"))
      external.push(request.url());
  });
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("storage is unavailable");
  await page.getByRole("button", { name: "Take it with you" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SKILL.md" }).click();
  expect((await download).suggestedFilename()).toBe("SKILL.md");
  expect(external).toEqual([]);
});
test("corrupt saved data recovers and confirmation is keyboard dismissible", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("tastecraft.profile.v1", "{broken"),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).not.toBeVisible();
});
test("invalid imports preserve existing work and valid imports restore", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "I prefer A" }).click();
  await page.getByLabel("Import Tastecraft profile").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.getByRole("status")).toContainText("not valid JSON");
  await expect(page.getByText("1 of 5")).toBeVisible();
  const valid = {
    version: 1,
    name: "Imported project",
    values: {
      density: 20,
      typography: 80,
      corners: 30,
      contrast: 40,
      motion: 0,
    },
    history: [],
  };
  await page.getByLabel("Import Tastecraft profile").setInputFiles({
    name: "profile.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(valid)),
  });
  await expect(
    page.getByRole("heading", { name: "Imported project" }),
  ).toBeVisible();
});
test("mobile and desktop fit without horizontal overflow; screenshots capture real UI", async ({
  page,
}) => {
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshot-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Make your taste tangible." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "I prefer B" }).click();
  await expect(
    page.getByRole("heading", { name: "How should your words feel?" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshot-mobile.png", fullPage: true });
});
