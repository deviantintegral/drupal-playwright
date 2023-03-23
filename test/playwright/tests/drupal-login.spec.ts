import { test, expect } from '@playwright/test';
import {Page} from "playwright";

// Olivero offers a great example of how tests can "randomly fail" when adding
// a mobile viewport. The menu at mobile viewports is collapsed. If you have a
// single test that tries to click on "Log in", that link won't be visible at
// mobile.
//
// We use test groups with grep and grepInvert in the configuration to handle
// viewport specific tests.
//
// https://stackoverflow.com/a/74385433/7982687
test.describe('mobile', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('https://drupal-playwright.ddev.site/');
  });
  test('invalid credentials do not allow login on mobile', async ({ page}) => {
    await page.getByLabel('Main Menu').click();
    await testInvalidLogin(page);
  });
});

test.describe('desktop', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('https://drupal-playwright.ddev.site/');
  });
  test('invalid credentials do not allow login on desktop', async ({page}) => {
    await testInvalidLogin(page);
  });
});

// If you run this many times quickly, eventually Drupal's flood protection
// will kick in and throw an error. This is where making sure you have a
// clean site to test against is important, because even this test that
// supposedly has no side effects does!
async function testInvalidLogin(page: Page) {
  await page.getByRole('link', {name: 'Log in'}).click();
  await page.getByLabel('Username').fill('test');
  await page.getByLabel('Username').press('Tab');
  await page.getByLabel('Password').fill('test');
  await page.getByRole('button', {name: 'Log in'}).click();
  await expect(page.getByText('Unrecognized username or password. Forgot your password?')).toBeVisible();
}

