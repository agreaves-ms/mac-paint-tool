using System.Text.Json;

namespace MacPaintTool.Tests;

public class SmileWorkflowTests : MacPaintTestBase
{
    [Fact]
    public async Task SmileWorkflow_DrawsCircleEyesAndCurveSmile()
    {
        await NavigateToAppAsync();

        var canvas = Page.Locator("#paint-canvas");
        await Expect(canvas).ToBeVisibleAsync();

        await Page.EvaluateAsync("""
            () => {
              const c = document.getElementById('paint-canvas');
              const ctx = c?.getContext('2d', { willReadFrequently: true });
              if (!c || !ctx) throw new Error('Canvas not ready');
              window.__smileBaseline = ctx.getImageData(0, 0, c.width, c.height).data.slice();
            }
        """);

        await SelectToolAsync("ellipse");
        await Page.Locator("#property-panel button[data-mode='stroke']").ClickAsync();
        await DrawLineAsync(332, 204, 692, 564, 50);

        await Page.Locator("#property-panel button[data-mode='fill']").ClickAsync();
        await DrawLineAsync(422, 314, 452, 344, 15);
        await DrawLineAsync(572, 314, 602, 344, 15);

        await SelectToolAsync("curve");
        await ClickCanvasAtAsync(402, 464);
        await ClickCanvasAtAsync(622, 464);
        await ClickCanvasAtAsync(512, 394);
        await Page.Keyboard.PressAsync("Enter");

        var metrics = await Page.EvaluateAsync<JsonElement>("""
            () => {
              const c = document.getElementById('paint-canvas');
              const ctx = c?.getContext('2d', { willReadFrequently: true });
              const baseline = window.__smileBaseline;
              if (!c || !ctx || !baseline) throw new Error('Baseline not found');

              const w = c.width, h = c.height;
              const now = ctx.getImageData(0, 0, w, h).data;

              const changedInRegion = (x, y, rw, rh) => {
                const sx = Math.max(0, Math.floor(x));
                const sy = Math.max(0, Math.floor(y));
                const ex = Math.min(w, Math.floor(x + rw));
                const ey = Math.min(h, Math.floor(y + rh));
                let changed = 0;
                for (let yy = sy; yy < ey; yy++) {
                  for (let xx = sx; xx < ex; xx++) {
                    const i = (yy * w + xx) * 4;
                    if (
                      now[i] !== baseline[i] ||
                      now[i + 1] !== baseline[i + 1] ||
                      now[i + 2] !== baseline[i + 2] ||
                      now[i + 3] !== baseline[i + 3]
                    ) changed++;
                  }
                }
                return changed;
              };

              let changedPixels = 0;
              for (let i = 0; i < now.length; i += 4) {
                if (
                  now[i] !== baseline[i] ||
                  now[i + 1] !== baseline[i + 1] ||
                  now[i + 2] !== baseline[i + 2] ||
                  now[i + 3] !== baseline[i + 3]
                ) changedPixels++;
              }

              const leftEyeChanged = changedInRegion(w / 2 - 120, h / 2 - 100, 70, 70);
              const rightEyeChanged = changedInRegion(w / 2 + 50, h / 2 - 100, 70, 70);
              const smileChanged = changedInRegion(w / 2 - 150, h / 2 + 20, 300, 150);

              return { changedPixels, leftEyeChanged, rightEyeChanged, smileChanged };
            }
        """);

        var changedPixels = metrics.GetProperty("changedPixels").GetInt32();
        var leftEyeChanged = metrics.GetProperty("leftEyeChanged").GetInt32();
        var rightEyeChanged = metrics.GetProperty("rightEyeChanged").GetInt32();
        var smileChanged = metrics.GetProperty("smileChanged").GetInt32();

        Assert.True(changedPixels > 2000, $"Expected meaningful drawing changes, got {changedPixels}");
        Assert.True(leftEyeChanged > 80, $"Left eye not visible enough: {leftEyeChanged}");
        Assert.True(rightEyeChanged > 80, $"Right eye not visible enough: {rightEyeChanged}");
        Assert.True(smileChanged > 120, $"Smile curve not visible enough: {smileChanged}");
    }
}
