import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const legacy = {
  version: 1,
  name: "Legacy direction",
  values: { density: 80, typography: 100, corners: 20, contrast: 0, motion: 0 },
  history: [{ axis: "density", value: 100 }],
};

test("migrates v1, manages independent profiles, confirms deletion and roundtrips a library backup", async ({
  page,
}) => {
  await page.addInitScript((profile) => {
    if (!localStorage.getItem("tastecraft.profile.v1"))
      localStorage.setItem("tastecraft.profile.v1", JSON.stringify(profile));
  }, legacy);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Legacy direction", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await page.getByLabel("Project name").fill("Product website");
  await page.getByLabel("Shape").fill("90");
  const options = await page
    .getByLabel("Saved profile")
    .locator("option")
    .evaluateAll((elements) =>
      elements.map((element) => (element as HTMLOptionElement).value),
    );
  await page.getByLabel("Saved profile").selectOption(options[0]);
  await expect(page.getByLabel("Shape")).toHaveValue("20");
  await page.getByLabel("Saved profile").selectOption(options[1]);
  await expect(page.getByLabel("Shape")).toHaveValue("90");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Product website", exact: true }),
  ).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Back up library" }).click();
  const file = await downloading;
  const backup = await readFile((await file.path())!, "utf8");
  expect(JSON.parse(backup).profiles).toHaveLength(2);
  await page
    .getByRole("button", { name: "Delete profile", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toContainText("Product website");
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Saved profile").locator("option")).toHaveCount(
    2,
  );
  await page
    .getByRole("button", { name: "Delete profile", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByLabel("Saved profile").locator("option")).toHaveCount(
    1,
  );
  await expect(
    page.getByRole("button", { name: "Delete profile", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Import Tastecraft profile").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(page.getByLabel("Saved profile").locator("option")).toHaveCount(
    3,
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("tastecraft.profile.v1")!),
    ),
  ).toEqual(legacy);
});

test("two tabs never silently overwrite each other and can recover explicitly", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("tastecraft.library.v2")),
    )
    .not.toBeNull();
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: "Make it yours" }).click();
  await other.getByLabel("Project name").fill("Saved from second tab");
  await expect(page.getByRole("alert")).toContainText("Another tab");
  await page.getByRole("button", { name: "Make it yours" }).click();
  await page.getByLabel("Project name").fill("Unsaved first tab");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect
    .poll(() =>
      other.evaluate(
        () =>
          JSON.parse(localStorage.getItem("tastecraft.library.v2")!).profiles[0]
            .profile.name,
      ),
    )
    .toBe("Saved from second tab");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Back up library" }).click();
  const downloaded = await downloading;
  expect(
    JSON.parse(await readFile((await downloaded.path())!, "utf8")).profiles[0]
      .profile.name,
  ).toBe("Unsaved first tab");
  await page
    .getByRole("button", { name: "Load latest library", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Project name")).toHaveValue(
    "Unsaved first tab",
  );
  await page
    .getByRole("button", { name: "Load latest library", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm load" }).click();
  await expect(page.getByLabel("Project name")).toHaveValue(
    "Saved from second tab",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("unreadable library remains untouched until explicit replacement", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("tastecraft.library.v2", "broken library"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "I prefer B" }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("tastecraft.library.v2")),
  ).toBe("broken library");
  await page.getByRole("button", { name: "Replace browser storage" }).click();
  await page.getByRole("button", { name: "Confirm replace" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("tastecraft.library.v2")!).profiles[0]
          .profile.values.density,
    ),
  ).toBe(100);
});

test("mobile settings preview has usable form controls and independent comparison state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Preview component").selectOption("settings");
  const first = page.getByRole("region", { name: "Option A preview" });
  const second = page.getByRole("region", { name: "Option B preview" });
  await first.getByLabel("Project digest").uncheck();
  await expect(first.getByLabel("Digest frequency")).toBeDisabled();
  await expect(second.getByLabel("Digest frequency")).toBeEnabled();
  await first.getByRole("button", { name: "Save preferences" }).click();
  await expect(first.getByRole("status")).toContainText("digest off");
  await page
    .getByRole("button", { name: "+ New profile", exact: true })
    .click();
  await page
    .getByLabel("Project name")
    .fill("A long project name that wraps gracefully on a small mobile screen");
  await page.getByLabel("Shape").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Shape")).toHaveValue("51");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshot-library-mobile.png",
    fullPage: true,
  });
});

test("imports that exceed library capacity preserve all existing profiles", async ({
  page,
}) => {
  const profiles = Array.from({ length: 20 }, (_, index) => ({
    id: `profile-${index}`,
    profile: { ...legacy, name: `Project ${index}` },
  }));
  await page.addInitScript(
    (library) =>
      localStorage.setItem("tastecraft.library.v2", JSON.stringify(library)),
    { version: 2, activeId: "profile-0", profiles },
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "+ New profile", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Import Tastecraft profile").setInputFiles({
    name: "extra.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.getByRole("status")).toContainText("up to 20");
  await expect(page.getByLabel("Saved profile").locator("option")).toHaveCount(
    20,
  );
});
