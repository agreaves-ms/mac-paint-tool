using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;

namespace MacPaintTool.Tests;

/// <summary>
/// Regression tests that draw a house scene using the Pencil tool via pointer events.
/// Requires a standalone Vite dev server running on port 5174:
/// <c>npx vite --config vite.renderer.config.ts --port 5174</c>
/// </summary>
public class PencilDrawingRegressionTests : PageTest
{
    private const string AppUrl = "http://localhost:5174";
    private const string OutputFileName = "pencil-drawing.png";

    public override BrowserNewContextOptions ContextOptions()
    {
        return new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = 1400, Height = 1100 }
        };
    }

    [Fact]
    public async Task WhenPencilDrawingCompleted_CaptureCanvas_ProducesExpectedImage()
    {
        await Page.GotoAsync(AppUrl, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });

        await Expect(Page).ToHaveTitleAsync("Mac Paint");

        await SelectPencilPreset();
        await DrawHouseScene();

        var outputPath = Path.Combine(GetOutputDirectory(), OutputFileName);

        await SaveCanvasToFile(outputPath);

        Assert.True(File.Exists(outputPath), $"Expected output file at {outputPath}");

        var fileInfo = new FileInfo(outputPath);
        Assert.True(fileInfo.Length > 10_000, $"Output file too small ({fileInfo.Length} bytes), drawing may be blank");
    }

    /// <summary>
    /// Clicks the Pencil preset button to set brush size=1, opacity=100, hardness=100.
    /// </summary>
    private async Task SelectPencilPreset()
    {
        await Page.GetByRole(AriaRole.Button, new() { Name = "Pencil" }).ClickAsync();

        // Verify pencil settings applied
        var sizeSlider = Page.GetByRole(AriaRole.Slider).First;
        await Expect(sizeSlider).ToHaveValueAsync("1");
    }

    /// <summary>
    /// Draws a house scene using pointer events dispatched to the canvas,
    /// so the BrushTool pencil preset processes each stroke.
    /// </summary>
    private async Task DrawHouseScene()
    {
        await Page.EvaluateAsync(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const rect = canvas.getBoundingClientRect();

            function pointerEvent(type, canvasX, canvasY) {
                const clientX = rect.left + (canvasX * rect.width / canvas.width);
                const clientY = rect.top + (canvasY * rect.height / canvas.height);
                canvas.dispatchEvent(new PointerEvent(type, {
                    clientX, clientY,
                    bubbles: true,
                    pointerId: 1,
                    pointerType: 'mouse',
                    pressure: type === 'pointerup' ? 0 : 0.5,
                    button: 0,
                    buttons: type === 'pointerup' ? 0 : 1,
                }));
            }

            function drawLine(x1, y1, x2, y2, steps) {
                steps = steps || 20;
                pointerEvent('pointerdown', x1, y1);
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    pointerEvent('pointermove', x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
                }
                pointerEvent('pointerup', x2, y2);
            }

            // Ground line
            drawLine(100, 500, 900, 500);

            // House body (rectangle)
            drawLine(300, 500, 300, 350);
            drawLine(300, 350, 600, 350);
            drawLine(600, 350, 600, 500);
            drawLine(300, 500, 600, 500);

            // Roof (triangle)
            drawLine(280, 350, 450, 250);
            drawLine(450, 250, 620, 350);
            drawLine(280, 350, 620, 350);

            // Door
            drawLine(420, 500, 420, 410);
            drawLine(420, 410, 480, 410);
            drawLine(480, 410, 480, 500);

            // Door knob
            drawLine(465, 455, 468, 452);
            drawLine(468, 452, 472, 455);
            drawLine(472, 455, 468, 458);
            drawLine(468, 458, 465, 455);

            // Left window
            drawLine(340, 380, 340, 420);
            drawLine(340, 380, 380, 380);
            drawLine(380, 380, 380, 420);
            drawLine(340, 420, 380, 420);
            drawLine(360, 380, 360, 420);
            drawLine(340, 400, 380, 400);

            // Right window
            drawLine(520, 380, 520, 420);
            drawLine(520, 380, 560, 380);
            drawLine(560, 380, 560, 420);
            drawLine(520, 420, 560, 420);
            drawLine(540, 380, 540, 420);
            drawLine(520, 400, 560, 400);

            // Chimney
            drawLine(530, 350, 530, 280);
            drawLine(530, 280, 560, 280);
            drawLine(560, 280, 560, 330);

            // Smoke
            drawLine(545, 280, 540, 260);
            drawLine(540, 260, 550, 240);
            drawLine(550, 240, 540, 220);

            // Tree trunk
            drawLine(750, 500, 750, 380);
            drawLine(770, 500, 770, 380);
            drawLine(750, 380, 770, 380);

            // Tree canopy (triangle)
            drawLine(710, 380, 760, 280);
            drawLine(760, 280, 810, 380);
            drawLine(710, 380, 810, 380);

            // Smaller upper canopy
            drawLine(720, 340, 760, 260);
            drawLine(760, 260, 800, 340);

            // Sun (circle)
            var sunCx = 850, sunCy = 150, sunR = 40;
            for (var angle = 0; angle < Math.PI * 2; angle += 0.15) {
                var x1 = sunCx + Math.cos(angle) * sunR;
                var y1 = sunCy + Math.sin(angle) * sunR;
                var na = angle + 0.15;
                var x2 = sunCx + Math.cos(na) * sunR;
                var y2 = sunCy + Math.sin(na) * sunR;
                drawLine(x1, y1, x2, y2, 5);
            }

            // Sun rays
            for (var a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                drawLine(
                    sunCx + Math.cos(a) * 45, sunCy + Math.sin(a) * 45,
                    sunCx + Math.cos(a) * 65, sunCy + Math.sin(a) * 65, 5
                );
            }

            // Path from door
            drawLine(440, 500, 430, 550);
            drawLine(460, 500, 470, 550);

            // Fence posts
            for (var x = 150; x < 300; x += 30) {
                drawLine(x, 500, x, 470);
            }
            // Fence rail
            drawLine(150, 485, 290, 485);
        }");
    }

    /// <summary>
    /// Extracts the canvas pixel data as a PNG data URL, decodes it, and writes to disk.
    /// </summary>
    private async Task SaveCanvasToFile(string outputPath)
    {
        var dataUrl = await Page.EvaluateAsync<string>(@"() => {
            const canvas = document.getElementById('paint-canvas');
            return canvas.toDataURL('image/png');
        }");

        var base64Data = dataUrl.Split(',')[1];
        var imageBytes = Convert.FromBase64String(base64Data);

        var directory = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await File.WriteAllBytesAsync(outputPath, imageBytes);
    }

    private static string GetOutputDirectory()
    {
        var projectRoot = FindProjectRoot();
        var outputDir = Path.Combine(projectRoot, "tests", "playwright", "output");
        Directory.CreateDirectory(outputDir);
        return outputDir;
    }

    private static string FindProjectRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "package.json")))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        return AppContext.BaseDirectory;
    }
}
