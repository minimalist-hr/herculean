using System.Reflection;

namespace Herculean.Training.UnitTests;

/// <summary>Guard test: every handler in the module has a unit test class.</summary>
public sealed class HandlerTestTests
{
    [Fact]
    public void EveryHandlerHasATestClass()
    {
        HashSet<string> testClasses = [.. typeof(HandlerTestTests).Assembly.GetTypes().Select(type => type.Name)];

        Assembly.Load("Herculean.Training.Application").GetTypes()
            .Where(type => type.Name.EndsWith("Handler", StringComparison.Ordinal))
            .Select(type => type.Name)
            .Where(handler => !testClasses.Contains($"{handler}Tests"))
            .ShouldBeEmpty();
    }
}
