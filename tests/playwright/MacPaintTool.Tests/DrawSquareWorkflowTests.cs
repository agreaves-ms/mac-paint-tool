namespace MacPaintTool.Tests;

public class DrawSquareWorkflowTests : MacPaintTestBase
{
    [Fact]
    public async Task DrawSquare_WorkflowRendersVisibleDrawing()
    {
        await NavigateToAppAsync();

        await SetForegroundColorAsync("#000000");
        await SelectToolAsync("rectangle");
        await Page.Locator("#property-panel button[data-mode='fill']").ClickAsync();

        await DrawLineAsync(320, 220, 520, 420, 40);

        var hasVisibleDrawing = await Page.EvaluateAsync<bool>(@"() => {
            const canvases = Array.from(document.querySelectorAll('#canvas-container canvas'));
            for (const canvas of canvases) {
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) continue;
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 0 && (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255)) {
                        return true;
                    }
                }
            }
            return false;
        }");

        Assert.True(hasVisibleDrawing, "Expected visible non-white drawing on at least one canvas layer");
    }
}
