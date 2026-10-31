using System.Reflection;

using ArchUnitNET.Fluent.Syntax.Elements.Types;
using ArchUnitNET.xUnitV3;

using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static Herculean.ArchitectureTests.HerculeanArchitecture;

namespace Herculean.ArchitectureTests;

/// <summary>Checks the dependency table in the wiki: Backend architecture, Dependencies.</summary>
public sealed class DependencyTests
{
    public static TheoryData<string> ModuleNames => new(Modules);

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void DomainReferencesOnlySharedKernel(string module)
    {
        Check(Layer(module, "Domain"), [ApiAssembly, ServiceDefaultsAssembly, .. AllLayersExcept(module, "Domain")]);
    }

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void ApplicationReferencesDomainSharedKernelAndContracts(string module)
    {
        Check(Layer(module, "Application"), [ApiAssembly, ServiceDefaultsAssembly, Layer(module, "Infrastructure"), .. OtherModulesInternals(module)]);
    }

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void InfrastructureReferencesOnlyItsOwnModule(string module)
    {
        Check(Layer(module, "Infrastructure"), [ApiAssembly, ServiceDefaultsAssembly, .. OtherModulesInternals(module)]);
    }

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void ContractsReferenceNothing(string module)
    {
        Check(Layer(module, "Contracts"), [SharedKernelAssembly, ApiAssembly, ServiceDefaultsAssembly, .. AllLayersExcept(module, "Contracts")]);
    }

    [Fact]
    public void SharedKernelReferencesNoModule()
    {
        Check(SharedKernelAssembly, [ApiAssembly, ServiceDefaultsAssembly, .. AllLayersExcept(module: null, layer: null)]);
    }

    [Fact]
    public void ApiReferencesOnlyInfrastructure()
    {
        Check(ApiAssembly, [.. Modules.SelectMany(module => new[] { Layer(module, "Domain"), Layer(module, "Application"), Layer(module, "Contracts") })]);
    }

    private static void Check(Assembly assembly, Assembly[] forbidden)
    {
        GivenTypesConjunction forbiddenTypes = Types().That().ResideInAssembly(forbidden[0], forbidden[1..])
            .And().DoNotResideInNamespaceMatching(CodeCoverageNamespace);

        // Projects with no types yet still pass.
        Types().That().ResideInAssembly(assembly)
            .Should().NotDependOnAny(forbiddenTypes)
            .WithoutRequiringPositiveResults()
            .Check(Architecture);
    }

    private static IEnumerable<Assembly> AllLayersExcept(string? module, string? layer) =>
        Modules.SelectMany(eachModule => Layers.Where(eachLayer => eachModule != module || eachLayer != layer).Select(eachLayer => Layer(eachModule, eachLayer)));

    // A module never references another module's Domain, Application or Infrastructure.
    private static IEnumerable<Assembly> OtherModulesInternals(string module) =>
        Modules.Where(other => other != module)
            .SelectMany(other => new[] { Layer(other, "Domain"), Layer(other, "Application"), Layer(other, "Infrastructure") });
}
