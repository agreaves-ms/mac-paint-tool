using Microsoft.Playwright;

namespace DocIntegrationTests;

/// <summary>
/// Shared fixture that authenticates once to doc-integration.pfizer.com
/// and provides the session to all test classes in the "DocIntegration" collection.
/// Uses persistent context to survive SSO cross-origin redirects.
/// Profile directory is GUID-randomized and cleaned up on disposal.
///
/// Configuration via environment variables:
///   APP_USERNAME     — login username (required)
///   APP_PASSWORD     — login password (required)
///   HEADED=1         — launch browser in headed mode (default: headless)
///   BROWSER_CHANNEL  — browser channel (default: msedge)
/// </summary>
public class DocIntegrationFixture : IAsyncLifetime
{
    private IPlaywright _playwright = null!;
    private string _profileDir = null!;

    /// <summary>
    /// The persistent browser context with authenticated session.
    /// </summary>
    public IBrowserContext Context { get; private set; } = null!;

    /// <summary>
    /// The page that completed login. Tests can navigate freely.
    /// </summary>
    public IPage Page { get; private set; } = null!;

    protected virtual int ViewportWidth => 1400;
    protected virtual int ViewportHeight => 900;

    public async Task InitializeAsync()
    {
        var username = Environment.GetEnvironmentVariable("APP_USERNAME")
            ?? throw new InvalidOperationException(
                "APP_USERNAME env var must be set. Run: $env:APP_USERNAME = '<your-username>'");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD")
            ?? throw new InvalidOperationException(
                "APP_PASSWORD env var must be set. Run: $env:APP_PASSWORD = '<your-password>'");

        _profileDir = Path.Combine(Path.GetTempPath(), $"pw-docint-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_profileDir);

        _playwright = await Playwright.CreateAsync();

        var channel = Environment.GetEnvironmentVariable("BROWSER_CHANNEL") ?? "msedge";
        var headed = Environment.GetEnvironmentVariable("HEADED") == "1";

        Context = await _playwright.Chromium.LaunchPersistentContextAsync(_profileDir, new()
        {
            Channel = channel,
            Headless = !headed,
            ViewportSize = new ViewportSize { Width = ViewportWidth, Height = ViewportHeight },
            AcceptDownloads = true
        });

        Page = Context.Pages.Count > 0 ? Context.Pages[0] : await Context.NewPageAsync();

        // Navigate to doc-integration and authenticate
        await Page.GotoAsync("https://doc-integration.pfizer.com/");

        // Fill login form
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Username" })
            .FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "Enter Password" })
            .FillAsync(password);

        // Wait for Log In button to become enabled, then click
        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "Log In", Exact = true });
        await Assertions.Expect(loginButton).ToBeEnabledAsync(new() { Timeout = 10_000 });
        await loginButton.ClickAsync();

        // Wait for login to complete (up to 30s for SSO redirect chain)
        await Page.WaitForFunctionAsync(
            "() => !document.body.innerText.includes('Enter Username')",
            null,
            new() { Timeout = 30_000 });

        // Verify no SSO error
        await Assertions.Expect(Page.GetByText("Sso Login Unsuccessful"))
            .Not.ToBeVisibleAsync(new() { Timeout = 5_000 });
    }

    public async Task DisposeAsync()
    {
        try { await Context.CloseAsync(); } catch { }
        _playwright.Dispose();
        try
        {
            if (Directory.Exists(_profileDir))
                Directory.Delete(_profileDir, recursive: true);
        }
        catch { /* Best-effort cleanup — profile dir may be locked briefly */ }
    }
}
