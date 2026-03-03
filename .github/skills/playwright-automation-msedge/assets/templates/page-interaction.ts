// Page Interaction Script Template (Edge)
// Copy this file and customize for standalone browser automation.
// Run with: npx ts-node page-interaction.ts
// Or: npx tsx page-interaction.ts
// Or (as .mjs): node page-interaction.mjs

import { chromium, type Browser, type Page } from 'playwright';

async function main(): Promise<void> {
  let browser: Browser | null = null;

  try {
    // Launch Edge — uses system-installed Edge, no download required
    browser = await chromium.launch({
      headless: false,
      channel: 'msedge',
    });

    // Create context with HTTPS error handling (useful for internal/staging sites)
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    const page: Page = await context.newPage();

    // Set viewport for canvas apps
    await page.setViewportSize({ width: 1400, height: 1100 });

    // Navigate to the app
    await page.goto('http://localhost:5174', {
      waitUntil: 'load',
      timeout: 30000,
    });

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // --- Element Interaction Examples ---

    // Click a button by role
    // await page.getByRole('button', { name: 'Brush' }).click();

    // Fill a text input by label
    // await page.getByLabel('Size').fill('5');

    // Select from a dropdown
    // await page.getByRole('combobox').selectOption('red');

    // --- Form Login Example (for SSO/login pages) ---

    // await page.fill('#username', process.env.APP_USERNAME || '');
    // await page.fill('#password', process.env.APP_PASSWORD || '');
    // await page.click('button[type="submit"]');
    // await page.waitForLoadState('networkidle');

    // --- Canvas Interaction Examples ---

    // Draw on the canvas via evaluate
    // await page.evaluate(() => {
    //   const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
    //   const ctx = canvas.getContext('2d');
    //   if (ctx) {
    //     ctx.strokeStyle = '#000000';
    //     ctx.lineWidth = 3;
    //     ctx.beginPath();
    //     ctx.moveTo(100, 100);
    //     ctx.lineTo(200, 200);
    //     ctx.stroke();
    //   }
    // });

    // --- Mouse Interaction Examples ---

    // Simulate drawing with mouse events
    // await page.mouse.move(100, 100);
    // await page.mouse.down();
    // await page.mouse.move(200, 200, { steps: 10 });
    // await page.mouse.up();

    // --- Screenshot ---

    // Take a screenshot
    await page.screenshot({ path: 'output.png', fullPage: true });
    console.log('Screenshot saved to output.png');

    // --- Save Canvas via Download ---

    // Trigger a canvas download (for apps without file save dialogs)
    // await page.evaluate(() => {
    //   const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
    //   const link = document.createElement('a');
    //   link.download = 'canvas-output.png';
    //   link.href = canvas.toDataURL();
    //   link.click();
    // });

  } catch (error) {
    console.error('Automation failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
