// Page Interaction Script Template
// Copy this file and customize for standalone browser automation.
// Run with: npx ts-node page-interaction.ts
// Or: npx tsx page-interaction.ts

import { chromium, type Browser, type Page } from 'playwright';

async function main(): Promise<void> {
  let browser: Browser | null = null;

  try {
    // Launch browser (set headless: false to see the browser)
    browser = await chromium.launch({ headless: false });
    const page: Page = await browser.newPage();

    // Set viewport for canvas apps
    await page.setViewportSize({ width: 1400, height: 1100 });

    // Navigate to the app
    await page.goto('http://localhost:5174');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // --- Element Interaction Examples ---

    // Click a button by role
    // await page.getByRole('button', { name: 'Brush' }).click();

    // Fill a text input by label
    // await page.getByLabel('Size').fill('5');

    // Select from a dropdown
    // await page.getByRole('combobox').selectOption('red');

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
