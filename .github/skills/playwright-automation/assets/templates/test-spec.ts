// Playwright Test Specification Template
// Copy this file to your tests/ directory as <feature>.spec.ts
// Rename the describe block and tests to match your feature.

import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should load the page', async ({ page }) => {
    // Verify the page loads with expected title
    await expect(page).toHaveTitle(/Expected Title/);
  });

  test('should interact with elements', async ({ page }) => {
    // Click a button
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify result
    await expect(page.getByText('Success')).toBeVisible();
  });

  test('should fill a form', async ({ page }) => {
    // Fill form fields
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should handle canvas drawing', async ({ page }) => {
    // For canvas-based apps, use evaluate to interact with the canvas
    await page.evaluate(() => {
      const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(100, 100, 50, 50);
      }
    });

    // Take a screenshot for visual verification
    await expect(page).toHaveScreenshot('canvas-state.png');
  });

  test('should match visual snapshot', async ({ page }) => {
    // Visual regression test
    await expect(page).toHaveScreenshot('baseline.png', {
      maxDiffPixels: 100,
    });
  });
});
