using Class = ArchUnitNET.Domain.Class;

using ArchUnitNET.xUnitV3;

using static ArchUnitNET.Fluent.ArchRuleDefinition;
using static Herculean.ArchitectureTests.HerculeanArchitecture;

namespace Herculean.ArchitectureTests;

/// <summary>Every class that can be sealed is sealed.</summary>
public sealed class SealedClassTests
{
    [Fact]
    public void ClassesWithoutDerivedClassesAreSealed()
    {
        Class[] baseClasses = [.. Architecture.Classes.Where(type => Architecture.Classes.Any(other => other.InheritedClasses.Contains(type)))];

        Classes().That().AreNotAbstract()
            .And().AreNot(baseClasses)
            .And().DoNotResideInNamespaceMatching(MigrationsNamespace)
            .Should().BeSealed()
            .Check(Architecture);
    }
}
