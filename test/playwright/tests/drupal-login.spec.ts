import { test, expect } from '@playwright/test';
import {Page} from "playwright";
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

async function testInvalidLogin(page: Page) {
  await page.getByRole('link', {name: 'Log in'}).click();
  await page.getByLabel('Username').fill('test');
  await page.getByLabel('Username').press('Tab');
  await page.getByLabel('Password').fill('test');
  await page.getByRole('button', {name: 'Log in'}).click();
  await expect(page.getByText('Unrecognized username or password. Forgot your password?')).toBeVisible();
}

