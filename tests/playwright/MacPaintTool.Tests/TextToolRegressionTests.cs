namespace MacPaintTool.Tests;

/// <summary>
/// Regression test for text tool interaction via real UI actions.
/// Opens the app, selects Text tool, sets foreground color to red,
/// writes text on canvas, commits with Enter, and captures a full-page screenshot.
/// Requires a standalone Vite dev server running on port 5174:
/// <c>npx vite --config vite.renderer.config.ts --port 5174</c>
/// </summary>
public class TextToolRegressionTests : MacPaintTestBase
{
    private const string OutputFileName = "text-screenshot.png";

    [Fact]
    public async Task WhenTextToolWritesRedText_CaptureFullPageScreenshot()
    {
        await NavigateToAppAsync();

        await SelectToolAsync("text");
        await SetForegroundColorAsync("#ff0000");
        await ClickCanvasAtAsync(300, 250);

        await Page.Keyboard.TypeAsync("Hello hello");
        await Page.Keyboard.PressAsync("Enter");
        await Page.WaitForTimeoutAsync(100);

        var outputPath = Path.Combine(GetOutputDirectory(), OutputFileName);
        await Page.ScreenshotAsync(new() { Path = outputPath, FullPage = true });

        AssertFileExistsAndNotEmpty(outputPath, minBytes: 2_000);
    }
}
