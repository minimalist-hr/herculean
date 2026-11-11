using System.Reflection;

using ArchUnitNET.Loader;

using Architecture = ArchUnitNET.Domain.Architecture;

namespace Herculean.ArchitectureTests;

/// <summary>The API's projects, loaded once for every architecture test.</summary>
internal static class HerculeanArchitecture
{
    public static readonly string[] Modules = ["Account", "Training", "Feedback"];
    public static readonly string[] Layers = ["Domain", "Application", "Infrastructure", "Contracts"];

    public static readonly Assembly SharedKernelAssembly = Assembly.Load("Herculean.SharedKernel");
    public static readonly Assembly ApiAssembly = Assembly.Load("Herculean.Api");
    public static readonly Assembly ServiceDefaultsAssembly = Assembly.Load("Herculean.ServiceDefaults");

    public static readonly Architecture Architecture = new ArchLoader()
        .LoadAssemblies([SharedKernelAssembly, ApiAssembly, ServiceDefaultsAssembly, .. Modules.SelectMany(module => Layers.Select(layer => Layer(module, layer)))])
        .Build();

    /// <summary>EF Core generates migrations as public, unsealed classes.</summary>
    public const string MigrationsNamespace = @".*\.Migrations$";

    /// <summary>Coverage on Linux (CI) adds a tracker type with the same name to every assembly, so it seems to link them.</summary>
    public const string CodeCoverageNamespace = @"^Microsoft\.CodeCoverage\..*";

    public static Assembly Layer(string module, string layer) => Assembly.Load($"Herculean.{module}.{layer}");
}
