namespace DocIntegrationTests;

/// <summary>
/// Marker class that associates the "DocIntegration" collection with the
/// DocIntegrationFixture. Test classes tagged with [Collection("DocIntegration")]
/// share a single authenticated fixture instance and run sequentially.
/// </summary>
[CollectionDefinition("DocIntegration")]
public class DocIntegrationCollection : ICollectionFixture<DocIntegrationFixture>
{
    // No code needed. This class links the collection name to the fixture type.
}
