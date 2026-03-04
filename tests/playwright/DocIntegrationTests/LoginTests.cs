using Microsoft.Playwright;

namespace DocIntegrationTests;

/// <summary>
/// Verifies that login to doc-integration.pfizer.com succeeded.
/// The actual login is performed by DocIntegrationFixture.InitializeAsync().
/// This test validates the post-login state: Home link visible, no errors.
/// Runs first — alphabetical class name ("L" < "T") ensures ordering
/// within the shared xUnit collection.
/// </summary>
[Collection("DocIntegration")]
public class LoginTests
{
    private readonly DocIntegrationFixture _session;

    public LoginTests(DocIntegrationFixture session) => _session = session;

    [Fact]
    public async Task Login_Succeeds_WithValidCredentials()
    {
        // Defensive navigation — ensure we start from the root page
        await _session.Page.GotoAsync("https://doc-integration.pfizer.com/",
            new() { WaitUntil = WaitUntilState.NetworkIdle, Timeout = 30_000 });

        // After SSO login the page redirects to the hierarchy selector.
        // Verify "Home" is visible in the sidebar — confirms login succeeded.
        await Assertions.Expect(_session.Page.GetByText("Home", new() { Exact = true }))
            .ToBeVisibleAsync(new() { Timeout = 15_000 });

        // Verify no SSO error text on the page
        await Assertions.Expect(_session.Page.GetByText("Sso Login Unsuccessful"))
            .Not.ToBeVisibleAsync();
        await Assertions.Expect(_session.Page.GetByText("Invalid credentials"))
            .Not.ToBeVisibleAsync();

        // Save screenshot
        await _session.Page.ScreenshotAsync(new() { Path = "login.png" });
    }
}
