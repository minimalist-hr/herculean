using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;

namespace Herculean.SharedKernel.UnitTests.Results;

public sealed class ProblemDetailsSchemaTransformerTests
{
    private readonly ProblemDetailsSchemaTransformer _transformer = new();

    [Fact]
    public async Task ProblemDetailsSchemaHasEveryFieldDocumented()
    {
        OpenApiSchema schema = new();

        await _transformer.TransformAsync(schema, ContextFor<ProblemDetails>(), TestContext.Current.CancellationToken);

        schema.Properties.ShouldNotBeNull().Keys.ShouldBe(["type", "title", "status", "detail", "code", "errors", "traceId"], ignoreOrder: true);
        schema.Properties.Values.ShouldAllBe(property => !string.IsNullOrEmpty(property.Description));
        schema.Required.ShouldBe(["type", "title", "status", "detail", "code", "traceId"], ignoreOrder: true);
    }

    [Fact]
    public async Task OtherSchemasStayTheSame()
    {
        OpenApiSchema schema = new();

        await _transformer.TransformAsync(schema, ContextFor<string>(), TestContext.Current.CancellationToken);

        schema.Properties.ShouldBeNull();
        schema.Description.ShouldBeNull();
    }

    private static OpenApiSchemaTransformerContext ContextFor<T>() => new()
    {
        DocumentName = "v1",
        JsonTypeInfo = JsonTypeInfo.CreateJsonTypeInfo<T>(new JsonSerializerOptions { TypeInfoResolver = new DefaultJsonTypeInfoResolver() }),
        JsonPropertyInfo = null,
        ParameterDescription = null,
        ApplicationServices = new ServiceCollection().BuildServiceProvider(),
    };
}
