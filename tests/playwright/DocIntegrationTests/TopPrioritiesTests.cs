using Microsoft.Playwright;

namespace DocIntegrationTests;

/// <summary>
/// Navigates through the organizational hierarchy to PGS > Biopharma > Biotech > Algete,
/// applies the selection, and verifies the Top Priorities section displays
/// the expected items inside the dashboard iframe.
/// </summary>
[Collection("DocIntegration")]
public class TopPrioritiesTests
{
    private readonly DocIntegrationFixture _session;

    public TopPrioritiesTests(DocIntegrationFixture session) => _session = session;

    [Fact]
    public async Task TopPriorities_ShowsExpectedItems_AfterNavigatingToAlgete()
    {
        // Defensive navigation — ensure we start from the root page
        await _session.Page.GotoAsync("https://doc-integration.pfizer.com/",
            new() { WaitUntil = WaitUntilState.NetworkIdle, Timeout = 30_000 });

        // Handle SSO re-entry prompt — wait up to 10s for it to appear
        var proceedLink = _session.Page.GetByText("PROCEED WITH LOGIN");
        try
        {
            await proceedLink.WaitForAsync(new() { State = WaitForSelectorState.Visible, Timeout = 10_000 });
            await proceedLink.ClickAsync();
            await _session.Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
        }
        catch (TimeoutException)
        {
            // Proceed button not present — already on the main page
        }

        // Navigate through the hierarchy: PGS > Biopharma > Biotech > Algete
        await _session.Page.GetByText("PGS").ClickAsync();
        await _session.Page.GetByText("Biopharma").ClickAsync();
        await _session.Page.GetByText("Biotech").ClickAsync();
        await _session.Page.GetByText("Algete").ClickAsync();

        // Confirm selection — click whichever button is visible
        var proceedBtn = _session.Page.GetByText("PROCEED WITH LOG IN");
        var applyBtn = _session.Page.GetByRole(AriaRole.Button, new() { Name = "Apply" });

        if (await proceedBtn.IsVisibleAsync())
        {
            await proceedBtn.ClickAsync();
        }
        else
        {
            await applyBtn.ClickAsync();
        }

        await _session.Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Content is inside an iframe — find the frame with the dashboard
        var dashboardFrame = _session.Page.FrameLocator("iframe[src*='xplt-vm-ops']");

        // Check for Top Priorities section
        await Assertions.Expect(dashboardFrame.GetByText("Top Priorities"))
            .ToBeVisibleAsync(new() { Timeout = 30_000 });

        // Verify priority items
        await Assertions.Expect(dashboardFrame.GetByText("Jeringas Vetter"))
            .ToBeVisibleAsync(new() { Timeout = 5_000 });
    }
}
