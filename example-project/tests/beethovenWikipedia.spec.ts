import { expect, test } from '@playwright/test';

test.describe('wikipedia', () => {
  test('when searching for beethoven we can find his death', async ({
    page,
  }) => {
    // Go to https://www.wikipedia.org/
    await page.goto('https://www.wikipedia.org/');
    // Click input[name="search"]
    await page.click('input[name="search"]');
    // Fill input[name="search"]
    await page.fill('input[name="search"]', 'Beethoven');
    // Press Enter
    await Promise.all([
      page.waitForNavigation(/*{ url: 'https://en.wikipedia.org/wiki/Ludwig_van_Beethoven' }*/),
      page.press('input[name="search"]', 'Enter'),
    ]);
    await expect(
      page.locator('text=26 March 1827(1827-03-26) (aged 56)Vienna'),
    ).toBeVisible();
  });
});
