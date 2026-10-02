import { expect, test } from "@playwright/test";

const password = "Password123!";

test.describe("JobOS core UI flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await page.getByLabel("Name").fill("E2E Candidate");
    await page.getByLabel("Email").fill(`e2e-${Date.now()}-${test.info().parallelIndex}@example.com`);
    await page.getByLabel("Password").fill(password);
    await page.locator("form").getByRole("button", { name: "Register" }).last().click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("onboards, creates dashboard records, and moves an application", async ({ page }) => {
    await page.getByLabel("Title").first().fill("Senior Product Engineer");
    await page.getByLabel("Company").fill("Northstar Labs");
    await page.getByLabel("Location").fill("Remote");
    await page.getByLabel("Description").first().fill("Build customer-facing workflow tools with TypeScript.");
    await page.getByRole("button", { name: "Save job" }).click();
    await expect(page.getByText("Job saved.")).toBeVisible();
    await expect(page.locator("p", { hasText: /^Senior Product Engineer$/ })).toBeVisible();

    await page.getByLabel("Name").fill("Core Resume");
    await page.getByLabel("Version title").fill("Product Engineering");
    await page.getByLabel("Summary").fill("Full-stack engineer focused on polished operations tools.");
    await page.getByRole("button", { name: "Create CV" }).click();
    await expect(page.getByText("Resume version created.")).toBeVisible();

    await page.getByRole("combobox", { name: "Job" }).selectOption({ index: 1 });
    await page.getByRole("combobox", { name: "CV version" }).selectOption({ index: 1 });
    await page.getByRole("combobox", { name: "Stage" }).selectOption("saved");
    await page.getByRole("button", { name: "Add application" }).click();
    await expect(page.getByText("Application added to pipeline.")).toBeVisible();

    await page.getByRole("combobox").last().selectOption("applied");
    await expect(page.getByText("Application stage updated.")).toBeVisible();
  });

  test("imports a pasted posting from Discover", async ({ page }) => {
    await page.getByRole("link", { name: "Discover jobs" }).click();
    await expect(page.getByRole("heading", { name: "Manual Job Import" })).toBeVisible();
    await page.getByPlaceholder("Paste the job post").fill(`
      Role: Staff Frontend Engineer
      Company: Meridian Systems
      Location: New York, NY
      Salary: $180k-$220k
      Build accessible React surfaces for workflow-heavy recruiting teams.
    `);
    await page.getByRole("button", { name: "Parse" }).click();
    await expect(page.getByLabel("Title")).toHaveValue("Staff Frontend Engineer");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Imported job saved.")).toBeVisible();
  });

  test("keeps settings, export, and document review surfaces reachable", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await page.goto("/settings/export");
    await expect(page.getByRole("heading", { name: "Data Export" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download JSON" })).toBeVisible();

    await page.goto("/documents/reviews");
    await expect(page.getByRole("heading", { name: "Grounding Reviews" })).toBeVisible();
  });
});
