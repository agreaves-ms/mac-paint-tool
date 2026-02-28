using Microsoft.Playwright;

namespace MacPaintTool.Tests;

/// <summary>
/// Regression tests that draw a house scene using the Pencil tool via pointer events.
/// Uses real UI interactions: clicks the Pencil preset button, then draws via PointerEvents
/// dispatched through PaintEngine so the BrushTool processes each stroke.
/// Requires a standalone Vite dev server running on port 5174:
/// <c>npx vite --config vite.renderer.config.ts --port 5174</c>
/// </summary>
public class PencilDrawingRegressionTests : MacPaintTestBase
{
    private const string OutputFileName = "pencil-drawing.png";

    [Fact]
    public async Task WhenPencilDrawingCompleted_CaptureCanvas_ProducesExpectedImage()
    {
        await NavigateToAppAsync();

        await SelectPresetAsync("Pencil");

        // Verify pencil settings applied
        var sizeSlider = Page.GetByRole(AriaRole.Slider).First;
        await Expect(sizeSlider).ToHaveValueAsync("1");

        await DrawHouseScene();

        var outputPath = Path.Combine(GetOutputDirectory(), OutputFileName);

        await SaveCanvasToFileAsync(outputPath);

        AssertFileExistsAndNotEmpty(outputPath);
    }

    /// <summary>
    /// Draws a house scene using the base class DrawLineAsync helper,
    /// which dispatches real PointerEvents through PaintEngine so the BrushTool
    /// pencil preset processes each stroke.
    /// </summary>
    private async Task DrawHouseScene()
    {
        // Ground line
        await DrawLineAsync(100, 500, 900, 500);

        // House body (rectangle)
        await DrawLineAsync(300, 500, 300, 350);
        await DrawLineAsync(300, 350, 600, 350);
        await DrawLineAsync(600, 350, 600, 500);
        await DrawLineAsync(300, 500, 600, 500);

        // Roof (triangle)
        await DrawLineAsync(280, 350, 450, 250);
        await DrawLineAsync(450, 250, 620, 350);
        await DrawLineAsync(280, 350, 620, 350);

        // Door
        await DrawLineAsync(420, 500, 420, 410);
        await DrawLineAsync(420, 410, 480, 410);
        await DrawLineAsync(480, 410, 480, 500);

        // Door knob
        await DrawLineAsync(465, 455, 468, 452);
        await DrawLineAsync(468, 452, 472, 455);
        await DrawLineAsync(472, 455, 468, 458);
        await DrawLineAsync(468, 458, 465, 455);

        // Left window
        await DrawLineAsync(340, 380, 340, 420);
        await DrawLineAsync(340, 380, 380, 380);
        await DrawLineAsync(380, 380, 380, 420);
        await DrawLineAsync(340, 420, 380, 420);
        await DrawLineAsync(360, 380, 360, 420);
        await DrawLineAsync(340, 400, 380, 400);

        // Right window
        await DrawLineAsync(520, 380, 520, 420);
        await DrawLineAsync(520, 380, 560, 380);
        await DrawLineAsync(560, 380, 560, 420);
        await DrawLineAsync(520, 420, 560, 420);
        await DrawLineAsync(540, 380, 540, 420);
        await DrawLineAsync(520, 400, 560, 400);

        // Chimney
        await DrawLineAsync(530, 350, 530, 280);
        await DrawLineAsync(530, 280, 560, 280);
        await DrawLineAsync(560, 280, 560, 330);

        // Smoke
        await DrawLineAsync(545, 280, 540, 260);
        await DrawLineAsync(540, 260, 550, 240);
        await DrawLineAsync(550, 240, 540, 220);

        // Tree trunk
        await DrawLineAsync(750, 500, 750, 380);
        await DrawLineAsync(770, 500, 770, 380);
        await DrawLineAsync(750, 380, 770, 380);

        // Tree canopy (triangle)
        await DrawLineAsync(710, 380, 760, 280);
        await DrawLineAsync(760, 280, 810, 380);
        await DrawLineAsync(710, 380, 810, 380);

        // Smaller upper canopy
        await DrawLineAsync(720, 340, 760, 260);
        await DrawLineAsync(760, 260, 800, 340);

        // Sun (circle approximation)
        var sunCx = 850.0;
        var sunCy = 150.0;
        var sunR = 40.0;
        for (var angle = 0.0; angle < Math.PI * 2; angle += 0.15)
        {
            var x1 = sunCx + Math.Cos(angle) * sunR;
            var y1 = sunCy + Math.Sin(angle) * sunR;
            var na = angle + 0.15;
            var x2 = sunCx + Math.Cos(na) * sunR;
            var y2 = sunCy + Math.Sin(na) * sunR;
            await DrawLineAsync(x1, y1, x2, y2, 5);
        }

        // Sun rays
        for (var a = 0.0; a < Math.PI * 2; a += Math.PI / 6)
        {
            await DrawLineAsync(
                sunCx + Math.Cos(a) * 45, sunCy + Math.Sin(a) * 45,
                sunCx + Math.Cos(a) * 65, sunCy + Math.Sin(a) * 65, 5);
        }

        // Path from door
        await DrawLineAsync(440, 500, 430, 550);
        await DrawLineAsync(460, 500, 470, 550);

        // Fence posts
        for (var x = 150; x < 300; x += 30)
        {
            await DrawLineAsync(x, 500, x, 470);
        }

        // Fence rail
        await DrawLineAsync(150, 485, 290, 485);
    }
}
