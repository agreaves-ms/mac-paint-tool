using Microsoft.Playwright;

namespace RegressionTests;

/// <summary>
/// Base class for Playwright tests that require a persistent browser context.
/// Use this instead of PageTest when testing SSO/OAuth/auth-redirect sites
/// where cross-origin navigation destroys in-memory browser contexts.
///
/// Provides Page, Context, and Expect() matching the PageTest API surface.
///
/// Configuration via environment variables:
///   HEADED=1          — launch browser in headed mode (default: headless)
///   BROWSER_CHANNEL   — browser channel (default: msedge)
/// </summary>
public abstract class PersistentBrowserTestBase : IAsyncLifetime
{
    private IPlaywright _playwright = null!;
    private IBrowserContext _context = null!;
    private string _profileDir = null!;

    /// <summary>
    /// The active page in the persistent browser context.
    /// </summary>
    protected IPage Page { get; private set; } = null!;

    /// <summary>
    /// The persistent browser context with user-data directory.
    /// </summary>
    protected IBrowserContext Context => _context;

    /// <summary>
    /// Viewport width for the browser. Override in subclass to customize.
    /// </summary>
    protected virtual int ViewportWidth => 1400;

    /// <summary>
    /// Viewport height for the browser. Override in subclass to customize.
    /// </summary>
    protected virtual int ViewportHeight => 900;

    /// <summary>
    /// Creates an assertions instance matching the PageTest Expect() API.
    /// </summary>
    protected static ILocatorAssertions Expect(ILocator locator) =>
        Assertions.Expect(locator);

    /// <summary>
    /// Creates an assertions instance for a page.
    /// </summary>
    protected static IPageAssertions Expect(IPage page) =>
        Assertions.Expect(page);

    public async Task InitializeAsync()
    {
        _profileDir = Path.Combine(Path.GetTempPath(), $"pw-profile-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_profileDir);

        _playwright = await Playwright.CreateAsync();

        var channel = Environment.GetEnvironmentVariable("BROWSER_CHANNEL") ?? "msedge";
        var headed = Environment.GetEnvironmentVariable("HEADED") == "1";

        var browserType = _playwright.Chromium;

        _context = await browserType.LaunchPersistentContextAsync(_profileDir, new BrowserTypeLaunchPersistentContextOptions
        {
            Channel = channel,
            Headless = !headed,
            ViewportSize = new ViewportSize { Width = ViewportWidth, Height = ViewportHeight },
            AcceptDownloads = true
        });

        Page = _context.Pages.Count > 0 ? _context.Pages[0] : await _context.NewPageAsync();
    }

    public async Task DisposeAsync()
    {
        try
        {
            await _context.CloseAsync();
        }
        catch
        {
            // Context may already be closed
        }

        _playwright.Dispose();

        try
        {
            if (Directory.Exists(_profileDir))
            {
                Directory.Delete(_profileDir, recursive: true);
            }
        }
        catch
        {
            // Best-effort cleanup — profile dir may be locked briefly
        }
    }
}
