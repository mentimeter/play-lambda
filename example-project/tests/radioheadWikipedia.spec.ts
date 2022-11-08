import { expect, test } from "@playwright/test";

test.describe("wikipedia radiohead", () => {
  test("searching for radiohead takes us to their page", async ({ page }) => {
    // Go to https://www.wikipedia.org/
    await page.goto("https://www.wikipedia.org/");
    // Click input[name="search"]
    await page.click('input[name="search"]');
    // Fill input[name="search"]
    await page.fill('input[name="search"]', "Radiohead");
    // Press Enter
    await page.press('input[name="search"]', "Enter");
    await expect(page).toHaveURL("https://en.wikipedia.org/wiki/Radiohead");
  });
});
