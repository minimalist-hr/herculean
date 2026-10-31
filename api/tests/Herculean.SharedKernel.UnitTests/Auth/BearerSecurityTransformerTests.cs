using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;

namespace Herculean.SharedKernel.UnitTests.Auth;

public sealed class BearerSecurityTransformerTests
{
    private readonly BearerSecurityTransformer _transformer = new();
    private readonly OpenApiDocument _document = new();

    [Fact]
    public async Task DocumentGetsTheBearerScheme()
    {
        await _transformer.TransformAsync(_document, null!, TestContext.Current.CancellationToken);

        IOpenApiSecurityScheme scheme = _document.Components.ShouldNotBeNull().SecuritySchemes.ShouldNotBeNull()["Bearer"];
        scheme.Type.ShouldBe(SecuritySchemeType.Http);
        scheme.Scheme.ShouldBe("bearer");
        scheme.Description.ShouldNotBeNullOrEmpty();
    }

    [Fact]
    public async Task ProtectedEndpointNeedsTheToken()
    {
        OpenApiOperation operation = new();

        await _transformer.TransformAsync(operation, ContextFor(), TestContext.Current.CancellationToken);

        operation.Security.ShouldNotBeNull().ShouldHaveSingleItem();
    }

    [Fact]
    public async Task AnonymousEndpointDoesNot()
    {
        OpenApiOperation operation = new();

        await _transformer.TransformAsync(operation, ContextFor(new AllowAnonymousAttribute()), TestContext.Current.CancellationToken);

        operation.Security.ShouldBeNull();
    }

    private OpenApiOperationTransformerContext ContextFor(params object[] endpointMetadata) => new()
    {
        DocumentName = "v1",
        Description = new ApiDescription { ActionDescriptor = new ActionDescriptor { EndpointMetadata = endpointMetadata } },
        ApplicationServices = new ServiceCollection().BuildServiceProvider(),
        Document = _document,
    };
}
