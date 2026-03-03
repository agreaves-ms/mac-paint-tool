using Microsoft.Playwright;
using Microsoft.Playwright.Xunit;

namespace MacPaintTool.Tests;

/// <summary>
/// Regression test: navigates to PGS Ops Center login page via SSO redirect,
/// fills username and password fields, and verifies the credentials are populated.
/// Uses Edge (msedge) channel — no Chromium download required.
/// </summary>
public class WorkflowRegressionTests : PageTest
{
    private const string BaseUrl = "https://doc-integration.pfizer.com/sso-redirect";
    private const int ViewportWidth = 1400;
    private const int ViewportHeight = 1100;

    public override BrowserNewContextOptions ContextOptions()
    {
        return new BrowserNewContextOptions
        {
            IgnoreHTTPSErrors = true,
            ViewportSize = new ViewportSize { Width = ViewportWidth, Height = ViewportHeight },
        };
    }

    [Fact]
    public async Task LoginForm_FillsCredentials_AndScreenshotCaptured()
    {
        // Step 1: Navigate to SSO redirect — it lands on /login
        await Page.GotoAsync(BaseUrl, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.Load,
            Timeout = 60_000,
        });

        // Wait for the login page to stabilize after redirect
        await Page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);

        // Verify we landed on the login page
        await Expect(Page).ToHaveTitleAsync("PGS Ops Center");

        // Step 2: Fill username
        var usernameField = Page.Locator("#username");
        await Expect(usernameField).ToBeVisibleAsync();
        await usernameField.FillAsync("kavitha");

        // Step 3: Fill password
        var passwordField = Page.Locator("#password");
        await Expect(passwordField).ToBeVisibleAsync();
        await passwordField.FillAsync("test");

        // Step 4: Assert credentials are filled correctly
        await Expect(usernameField).ToHaveValueAsync("kavitha");
        await Expect(passwordField).ToHaveValueAsync("test");

        // Take screenshot as verification evidence
        await Page.ScreenshotAsync(new PageScreenshotOptions
        {
            Path = "TestResults/login-filled-screenshot.png",
            FullPage = true,
        });
    }
}
