using Microsoft.Playwright;

// Place generated persistent-context tests under: tests/playwright/RegressionTests/

namespace RegressionTests;

public class {{TestClassName}} : PersistentBrowserTestBase
{
    [Fact]
    public async Task {{BehaviorDrivenTestName}}()
    {
        // Read credentials from environment variables — never hardcode
        var username = Environment.GetEnvironmentVariable("APP_USERNAME");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD");
        Assert.False(string.IsNullOrEmpty(username), "APP_USERNAME env var must be set");
        Assert.False(string.IsNullOrEmpty(password), "APP_PASSWORD env var must be set");

        // Navigate — SSO sites will redirect; persistent context survives this
        await Page.GotoAsync("{{BaseUrl}}");

        // Fill credentials
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "{{UsernameLabel}}" }).FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "{{PasswordLabel}}" }).FillAsync(password);

        // Submit
        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "{{LoginButtonName}}", Exact = true });
        await Expect(loginButton).ToBeEnabledAsync();
        await loginButton.ClickAsync();

        // Wait for post-login redirect
        await Page.WaitForURLAsync(url => !url.Contains("/login"), new() { Timeout = 30000 });

        // Assert success
        await Expect(Page.GetByText("{{ErrorText}}")).Not.ToBeVisibleAsync();
        {{AdditionalAssertions}}

        // Screenshot
        await Page.ScreenshotAsync(new() { Path = "{{ScreenshotFilename}}" });
    }
}
