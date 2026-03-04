using Microsoft.Playwright;

// Place generated collection-fixture tests under: tests/playwright/{{ProjectName}}/

namespace {{Namespace}};

/// <summary>
/// {{TestDescription}}
/// Receives authenticated session from {{FixtureClassName}} via constructor injection.
/// </summary>
[Collection("{{CollectionName}}")]
public class {{TestClassName}}
{
    private readonly {{FixtureClassName}} _session;

    public {{TestClassName}}({{FixtureClassName}} session) => _session = session;

    [Fact]
    public async Task {{BehaviorDrivenTestName}}()
    {
        // Navigate to starting URL (defensive — in case a prior test navigated away)
        await _session.Page.GotoAsync("{{StartingUrl}}");

        {{StepCode}}

        {{AssertionCode}}
    }
}
