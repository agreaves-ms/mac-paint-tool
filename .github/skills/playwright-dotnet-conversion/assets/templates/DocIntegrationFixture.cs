using Microsoft.Playwright;

namespace {{Namespace}};

/// <summary>
/// Shared fixture that authenticates once and provides the session to all
/// test classes in the collection. Uses persistent context to survive
/// SSO cross-origin redirects. Profile directory is GUID-randomized
/// and cleaned up on disposal.
///
/// Configuration via environment variables:
///   APP_USERNAME     — login username (required)
///   APP_PASSWORD     — login password (required)
///   HEADED=1         — launch browser in headed mode (default: headless)
///   BROWSER_CHANNEL  — browser channel (default: msedge)
/// </summary>
public class {{FixtureClassName}} : IAsyncLifetime
{
    private IPlaywright _playwright = null!;
    private string _profileDir = null!;

    public IBrowserContext Context { get; private set; } = null!;
    public IPage Page { get; private set; } = null!;

    protected virtual int ViewportWidth => 1400;
    protected virtual int ViewportHeight => 900;

    public async Task InitializeAsync()
    {
        var username = Environment.GetEnvironmentVariable("APP_USERNAME")
            ?? throw new InvalidOperationException("APP_USERNAME env var must be set");
        var password = Environment.GetEnvironmentVariable("APP_PASSWORD")
            ?? throw new InvalidOperationException("APP_PASSWORD env var must be set");

        _profileDir = Path.Combine(Path.GetTempPath(), $"pw-{{ProfilePrefix}}-{Guid.NewGuid():N}");
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

        // Navigate and authenticate
        await Page.GotoAsync("{{LoginUrl}}");

        await Page.GetByRole(AriaRole.Textbox, new() { Name = "{{UsernameLabel}}" })
            .FillAsync(username);
        await Page.GetByRole(AriaRole.Textbox, new() { Name = "{{PasswordLabel}}" })
            .FillAsync(password);

        var loginButton = Page.GetByRole(AriaRole.Button, new() { Name = "{{LoginButtonName}}", Exact = true });
        await Assertions.Expect(loginButton).ToBeEnabledAsync(new() { Timeout = 10_000 });
        await loginButton.ClickAsync();

        // Wait for login to complete
        {{PostLoginWaitLogic}}

        // Verify no login error
        await Assertions.Expect(Page.GetByText("{{ErrorText}}"))
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
        catch { /* Best-effort cleanup */ }
    }
}
