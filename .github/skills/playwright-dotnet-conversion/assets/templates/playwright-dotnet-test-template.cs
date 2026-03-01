using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;

// Place generated tests under: tests/playwright/MacPaintTool.Tests/

namespace MacPaintTool.Tests;

public class {{TestClassName}} : PageTest
{
    [Fact]
    public async Task {{BehaviorDrivenTestName}}()
    {
        await Page.GotoAsync("{{BaseUrl}}");

        // Arrange and act
        {{StepCode}}

        // Assert
        await Expect(Page.Locator("{{AssertionSelector}}")).ToContainTextAsync("{{ExpectedText}}");
    }
}