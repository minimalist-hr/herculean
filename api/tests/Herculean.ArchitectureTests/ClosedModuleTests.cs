using ArchUnitNET.xUnitV3;

using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static Herculean.ArchitectureTests.HerculeanArchitecture;

namespace Herculean.ArchitectureTests;

/// <summary>Outside a module, only its Module class and its Contracts are visible.</summary>
public sealed class ClosedModuleTests
{
    public static TheoryData<string> ModuleNames => new(Modules);

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void OnlyTheModuleClassIsPublic(string module)
    {
        Types().That().ResideInAssembly(Layer(module, "Domain"), Layer(module, "Application"), Layer(module, "Infrastructure"))
            .And().ArePublic()
            .And().DoNotResideInNamespaceMatching(MigrationsNamespace)
            .Should().HaveFullName($"Herculean.{module}.Infrastructure.{module}Module")
            .Check(Architecture);
    }
}
