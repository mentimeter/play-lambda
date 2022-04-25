import { expect, test } from '@playwright/test';

test.describe('duck duck footer', () => {
  test('contains frequently asked questions', async ({ page }) => {
    // Go to https://duckduckgo.com/
    await page.goto('https://duckduckgo.com/');

    await expect(page.locator('text=Frequently Asked Questions')).toBeVisible();
  });

  test('contains make money', async ({ page, context }) => {
    // Go to https://duckduckgo.com/
    await page.goto('https://duckduckgo.com/');

    await expect(page.locator('text=make money')).toBeVisible();
    const otherPage = await context.newPage();
    await otherPage.goto('https://google.com');
  });
});
