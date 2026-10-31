using System.Globalization;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.Json;

using FluentValidation;

using Herculean.Account.Infrastructure;
using Herculean.SharedKernel.Entities;
using Herculean.Training.Infrastructure;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using static Herculean.ArchitectureTests.HerculeanArchitecture;

namespace Herculean.ArchitectureTests;

/// <summary>Fail when a piece is missing: the guard tests in the wiki, Backend architecture, Tests.</summary>
public sealed class GuardTests
{
    private static readonly string[] RegisteredSuffixes = ["Handler", "Validator", "Repository"];
    private static readonly string[] ModuleLayers = ["Domain", "Application", "Infrastructure"];

    public static TheoryData<string> ModuleNames => new(Modules);

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void EveryRequestHasAValidator(string module)
    {
        Type[] types = Layer(module, "Application").GetTypes();
        HashSet<Type> validated = [.. types
            .SelectMany(type => type.GetInterfaces())
            .Where(type => type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IValidator<>))
            .Select(type => type.GetGenericArguments()[0])];

        types.Where(type => type.Name.EndsWith("Request", StringComparison.Ordinal) && !validated.Contains(type))
            .Select(type => type.Name)
            .ShouldBeEmpty();
    }

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void EveryHandlerValidatorAndRepositoryIsRegistered(string module)
    {
        WebApplicationBuilder builder = CreateApiBuilder();
        HashSet<Type?> registered = [.. builder.Services.Select(service => service.ImplementationType)];

        ModuleTypes(module)
            .Where(type => type.IsClass && !type.IsAbstract)
            .Where(type => RegisteredSuffixes.Any(suffix => type.Name.EndsWith(suffix, StringComparison.Ordinal)))
            .Where(type => !registered.Contains(type))
            .Select(type => type.Name)
            .ShouldBeEmpty();
    }

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void EveryEndpointIsMapped(string module)
    {
        using WebApplication app = CreateApiBuilder().Build();
        app.MapAccountModuleEndpoints();
        app.MapTrainingModuleEndpoints();

        HashSet<Type?> mapped = [.. ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(source => source.Endpoints)
            .SelectMany(endpoint => endpoint.Metadata.OfType<MethodInfo>())
            .Select(method => method.DeclaringType)];

        Layer(module, "Application").GetTypes()
            .Where(type => type.Name.EndsWith("Endpoint", StringComparison.Ordinal) && !mapped.Contains(type))
            .Select(type => type.Name)
            .ShouldBeEmpty();
    }

    [Theory]
    [MemberData(nameof(ModuleNames))]
    public void EveryEntityHasAConfigurationClass(string module)
    {
        HashSet<Type> configured = [.. Layer(module, "Infrastructure").GetTypes()
            .SelectMany(type => type.GetInterfaces())
            .Where(type => type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>))
            .Select(type => type.GetGenericArguments()[0])];

        Entities(module)
            .Where(type => !configured.Contains(type))
            .Select(type => type.Name)
            .ShouldBeEmpty();
    }

    [Fact]
    public void EveryTrainingEntityHasAUserId()
    {
        Entities("Training")
            .Where(type => type.GetProperty("UserId") is null)
            .Select(type => type.Name)
            .ShouldBeEmpty();
    }

    [Fact]
    public void EveryEndpointResponseAndFieldIsDocumented()
    {
        using JsonDocument document = JsonDocument.Parse(File.ReadAllText(OpenApiDocumentPath()));
        JsonElement root = document.RootElement;
        List<string> undocumented = [];

        foreach (JsonProperty path in root.GetProperty("paths").EnumerateObject())
        {
            foreach (JsonProperty operation in path.Value.EnumerateObject())
            {
                string name = $"{operation.Name.ToUpperInvariant()} {path.Name}";
                RequireText(operation.Value, "summary", name, undocumented);
                RequireText(operation.Value, "description", name, undocumented);

                foreach (JsonProperty response in operation.Value.GetProperty("responses").EnumerateObject())
                {
                    // ASP.NET Core puts the status name there when nothing else is given.
                    string description = response.Value.GetProperty("description").GetString() ?? string.Empty;
                    if (description == ReasonPhrases.GetReasonPhrase(int.Parse(response.Name, CultureInfo.InvariantCulture)))
                    {
                        undocumented.Add($"{name} {response.Name}");
                    }
                }
            }
        }

        foreach (JsonProperty schema in root.GetProperty("components").GetProperty("schemas").EnumerateObject())
        {
            RequireText(schema.Value, "description", schema.Name, undocumented);

            // An enum schema has no properties.
            if (!schema.Value.TryGetProperty("properties", out JsonElement properties))
            {
                continue;
            }

            foreach (JsonProperty property in properties.EnumerateObject())
            {
                // A nullable reference, for example an optional enum, keeps its description inside oneOf.
                JsonElement documented = property.Value.TryGetProperty("oneOf", out JsonElement oneOf)
                    ? oneOf.EnumerateArray().FirstOrDefault(option => option.TryGetProperty("description", out _))
                    : property.Value;

                RequireText(documented.ValueKind == JsonValueKind.Undefined ? property.Value : documented, "description", $"{schema.Name}.{property.Name}", undocumented);
            }
        }

        undocumented.ShouldBeEmpty();
    }

    private static void RequireText(JsonElement element, string key, string name, List<string> undocumented)
    {
        if (!element.TryGetProperty(key, out JsonElement text) || string.IsNullOrWhiteSpace(text.GetString()))
        {
            undocumented.Add($"{name} {key}");
        }
    }

    // The build writes api/openapi.json, and CI checks it is up to date.
    private static string OpenApiDocumentPath([CallerFilePath] string thisFile = "") =>
        Path.Combine(Path.GetDirectoryName(thisFile)!, "..", "..", "openapi.json");

    // The modules as the API composes them.
    private static WebApplicationBuilder CreateApiBuilder()
    {
        WebApplicationBuilder builder = WebApplication.CreateSlimBuilder();
        builder.Configuration["ConnectionStrings:database"] = "Host=localhost";
        builder.AddAccountModule();
        builder.AddTrainingModule();

        return builder;
    }

    private static IEnumerable<Type> ModuleTypes(string module) =>
        ModuleLayers.SelectMany(layer => Layer(module, layer).GetTypes());

    private static IEnumerable<Type> Entities(string module) =>
        Layer(module, "Domain").GetTypes().Where(type => !type.IsAbstract && type.IsSubclassOf(typeof(Entity)));
}
