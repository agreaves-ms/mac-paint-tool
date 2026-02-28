using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;

namespace MacPaintTool.Tests;

/// <summary>
/// Base class for Mac Paint Tool Playwright tests.
/// Provides shared navigation, canvas interaction, UI helpers, and output utilities.
/// All drawing helpers dispatch real PointerEvents through the app's PaintEngine pipeline.
/// </summary>
public abstract class MacPaintTestBase : PageTest
{
    protected const string AppUrl = "http://localhost:5174";
    protected const int CanvasWidth = 1024;
    protected const int CanvasHeight = 768;
    protected const int ViewportWidth = 1400;
    protected const int ViewportHeight = 1100;

    public override BrowserNewContextOptions ContextOptions()
    {
        return new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = ViewportWidth, Height = ViewportHeight }
        };
    }

    /// <summary>
    /// Navigates to the app and asserts the page title.
    /// </summary>
    protected async Task NavigateToAppAsync()
    {
        await Page.GotoAsync(AppUrl, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });
        await Expect(Page).ToHaveTitleAsync("Mac Paint");
    }

    // ── Tool Selection ───────────────────────────────────────────────

    /// <summary>
    /// Clicks a toolbar button by its tool name (data-tool attribute).
    /// Tool names: brush, eraser, fill, gradient, selection, marquee, lasso,
    /// eyedropper, text, line, rectangle, ellipse, roundedRect, polygon, curve.
    /// </summary>
    protected async Task SelectToolAsync(string toolName)
    {
        var button = Page.Locator($"button[data-tool='{toolName}']");
        await button.ClickAsync();
    }

    /// <summary>
    /// Clicks a brush preset button by its display name (e.g., "Pencil", "Marker").
    /// </summary>
    protected async Task SelectPresetAsync(string presetName)
    {
        await Page.GetByRole(AriaRole.Button, new() { Name = presetName }).ClickAsync();
    }

    // ── Canvas Drawing (Real Pointer Events) ─────────────────────────

    /// <summary>
    /// Dispatches a PointerEvent on the canvas at the given canvas-space coordinates.
    /// Converts canvas coordinates to client coordinates accounting for canvas scaling.
    /// </summary>
    protected async Task DispatchPointerEventAsync(string eventType, double canvasX, double canvasY, double pressure = 0.5)
    {
        var effectivePressure = eventType == "pointerup" ? 0 : pressure;
        var buttons = eventType == "pointerup" ? 0 : 1;

        await Page.EvaluateAsync(@"([type, cx, cy, p, btns]) => {
            const canvas = document.getElementById('paint-canvas');
            const rect = canvas.getBoundingClientRect();
            const clientX = rect.left + (cx * rect.width / canvas.width);
            const clientY = rect.top + (cy * rect.height / canvas.height);
            canvas.dispatchEvent(new PointerEvent(type, {
                clientX, clientY, bubbles: true, pointerId: 1,
                pointerType: 'mouse', pressure: p,
                button: 0, buttons: btns,
            }));
        }", new object[] { eventType, canvasX, canvasY, effectivePressure, buttons });
    }

    /// <summary>
    /// Draws a line on the canvas using real pointer events dispatched through PaintEngine.
    /// The currently selected tool processes each stroke segment.
    /// </summary>
    protected async Task DrawLineAsync(double x1, double y1, double x2, double y2, int steps = 20)
    {
        await DispatchPointerEventAsync("pointerdown", x1, y1);
        for (var i = 1; i <= steps; i++)
        {
            var t = (double)i / steps;
            var x = x1 + (x2 - x1) * t;
            var y = y1 + (y2 - y1) * t;
            await DispatchPointerEventAsync("pointermove", x, y);
        }
        await DispatchPointerEventAsync("pointerup", x2, y2);
    }

    /// <summary>
    /// Draws a path through multiple points using real pointer events.
    /// Each segment is interpolated with the specified number of steps.
    /// </summary>
    protected async Task DrawPathAsync(IEnumerable<(double x, double y)> points, int stepsPerSegment = 10)
    {
        var pointList = points.ToList();
        if (pointList.Count < 2) return;

        await DispatchPointerEventAsync("pointerdown", pointList[0].x, pointList[0].y);

        for (var i = 1; i < pointList.Count; i++)
        {
            var prev = pointList[i - 1];
            var curr = pointList[i];
            for (var s = 1; s <= stepsPerSegment; s++)
            {
                var t = (double)s / stepsPerSegment;
                var x = prev.x + (curr.x - prev.x) * t;
                var y = prev.y + (curr.y - prev.y) * t;
                await DispatchPointerEventAsync("pointermove", x, y);
            }
        }

        var last = pointList[^1];
        await DispatchPointerEventAsync("pointerup", last.x, last.y);
    }

    /// <summary>
    /// Clicks on the canvas at a specific point (pointer down + up at same location).
    /// Useful for fill tool, eyedropper, or placing text.
    /// </summary>
    protected async Task ClickCanvasAtAsync(double canvasX, double canvasY)
    {
        await DispatchPointerEventAsync("pointerdown", canvasX, canvasY);
        await DispatchPointerEventAsync("pointerup", canvasX, canvasY);
    }

    // ── Property Panel Controls ──────────────────────────────────────

    /// <summary>
    /// Sets a slider in the property panel by its label text.
    /// Dispatches an 'input' event to trigger the app's change handler.
    /// </summary>
    protected async Task SetSliderValueAsync(string labelText, int value)
    {
        await Page.EvaluateAsync(@"([label, val]) => {
            const labels = Array.from(document.querySelectorAll('.prop-label'));
            const target = labels.find(l => l.textContent.includes(label));
            if (!target) return;
            const section = target.closest('.prop-section') || target.parentElement;
            const slider = section?.querySelector('input[type=""range""]');
            if (slider) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                ).set;
                nativeInputValueSetter.call(slider, val.toString());
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }", new object[] { labelText, value });
    }

    /// <summary>
    /// Sets the foreground color using the color picker input.
    /// </summary>
    protected async Task SetForegroundColorAsync(string hexColor)
    {
        await Page.EvaluateAsync(@"(color) => {
            const input = document.querySelector('#fg-color, input[type=""color""]');
            if (input) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                ).set;
                nativeInputValueSetter.call(input, color);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }", hexColor);
    }

    // ── Canvas Inspection ────────────────────────────────────────────

    /// <summary>
    /// Returns the RGBA color at a specific canvas pixel as a 4-element array [R, G, B, A].
    /// </summary>
    protected async Task<int[]> GetCanvasPixelColorAsync(int x, int y)
    {
        return await Page.EvaluateAsync<int[]>(@"([px, py]) => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const pixel = ctx.getImageData(px, py, 1, 1).data;
            return [pixel[0], pixel[1], pixel[2], pixel[3]];
        }", new object[] { x, y });
    }

    /// <summary>
    /// Asserts the canvas is not blank by checking for non-white, non-transparent pixels.
    /// </summary>
    protected async Task AssertCanvasNotBlankAsync()
    {
        var hasPixels = await Page.EvaluateAsync<bool>(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0 && (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255)) {
                    return true;
                }
            }
            return false;
        }");

        Assert.True(hasPixels, "Canvas appears to be blank — no non-white pixels found");
    }

    // ── File Output ──────────────────────────────────────────────────

    /// <summary>
    /// Extracts the canvas as a PNG data URL, decodes it, and writes to disk.
    /// </summary>
    protected async Task SaveCanvasToFileAsync(string outputPath)
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

    /// <summary>
    /// Generates an SVG file wrapping the canvas content as an embedded PNG image.
    /// </summary>
    protected async Task SaveCanvasAsSvgAsync(string outputPath)
    {
        var svgContent = await Page.EvaluateAsync<string>(@"() => {
            const canvas = document.getElementById('paint-canvas');
            const W = canvas.width;
            const H = canvas.height;
            const dataUrl = canvas.toDataURL('image/png');
            return `<?xml version=""1.0"" encoding=""UTF-8""?>\n<svg xmlns=""http://www.w3.org/2000/svg"" width=""${W}"" height=""${H}"" viewBox=""0 0 ${W} ${H}"">\n  <image href=""${dataUrl}"" x=""0"" y=""0"" width=""${W}"" height=""${H}"" preserveAspectRatio=""none"" />\n</svg>\n`;
        }");

        var directory = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await File.WriteAllTextAsync(outputPath, svgContent);
    }

    /// <summary>
    /// Asserts that a file exists and has at least the specified minimum size.
    /// </summary>
    protected static void AssertFileExistsAndNotEmpty(string path, long minBytes = 10_000)
    {
        Assert.True(File.Exists(path), $"Expected output file at {path}");
        var fileInfo = new FileInfo(path);
        Assert.True(fileInfo.Length > minBytes, $"Output file too small ({fileInfo.Length} bytes), drawing may be blank");
    }

    // ── Path Resolution ──────────────────────────────────────────────

    protected static string GetOutputDirectory()
    {
        var projectRoot = FindProjectRoot();
        var outputDir = Path.Combine(projectRoot, "tests", "playwright", "output");
        Directory.CreateDirectory(outputDir);
        return outputDir;
    }

    protected static string FindProjectRoot()
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
