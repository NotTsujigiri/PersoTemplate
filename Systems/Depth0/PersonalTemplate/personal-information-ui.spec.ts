import { expect,test } from "./file-application.test-support.ts";

test("User owns personal information and preserves edits across tabs and reload", async ({
  page,
}, info) => {
  await page.goto("/?area=repositories");
  await expect(page.locator("#prompt")).toBeEnabled();
  await expect(page.locator('select[aria-label="Channel"]')).not.toContainText(
    "Personal information",
  );
  await page.getByRole("button", { name: "User", exact: true }).click();
  const form = page.getByRole("form", {
    name: "Personal information",
    exact: true,
  });
  await expect(form).toBeVisible();
  await expect(page.locator("#user .catalog-list")).toBeVisible();
  await expect(page.locator("#user .catalog-content")).toBeVisible();
  if (!(await form.getByLabel("Experience 1", { exact: true }).count()))
    await form
      .getByRole("button", { name: "Add Experience", exact: true })
      .click();
  await form
    .getByLabel("Experience 1", { exact: true })
    .fill("Retain the User tab draft");
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await page.getByRole("button", { name: "User", exact: true }).click();
  await expect(form.getByLabel("Experience 1", { exact: true })).toHaveValue(
    "Retain the User tab draft",
  );
  await expect(page.locator("#user-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.setViewportSize({ width: 928, height: 639 });
  await page.screenshot({ path: info.outputPath("user-928.png") });
  await page.setViewportSize({ width: 554, height: 582 });
  await page.screenshot({ path: info.outputPath("user-554.png") });
  expect(
    await page
      .locator(".app-header")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.reload();
  await expect(form).toBeVisible();
  await expect(page.locator("#user-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
