namespace {{Namespace}};

/// <summary>
/// Marker class that associates the "{{CollectionName}}" collection
/// with the {{FixtureClassName}} fixture. Test classes tagged with
/// [Collection("{{CollectionName}}")] share a single fixture instance.
/// </summary>
[CollectionDefinition("{{CollectionName}}")]
public class {{CollectionClassName}} : ICollectionFixture<{{FixtureClassName}}>
{
    // No code needed. This class links the collection name to the fixture type.
}
