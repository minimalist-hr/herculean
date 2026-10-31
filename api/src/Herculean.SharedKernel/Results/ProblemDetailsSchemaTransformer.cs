using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Herculean.SharedKernel.Results;

/// <summary>Documents the one error shape that <see cref="ProblemDetailsExtensions"/> gives every response.</summary>
public sealed class ProblemDetailsSchemaTransformer : IOpenApiSchemaTransformer
{
    /// <inheritdoc />
    public Task TransformAsync(OpenApiSchema schema, OpenApiSchemaTransformerContext context, CancellationToken cancellationToken)
    {
        if (context.JsonTypeInfo.Type != typeof(ProblemDetails))
        {
            return Task.CompletedTask;
        }

        schema.Description = "An error, as Problem Details (RFC 9457). Every error has the same fields.";
        schema.Properties = new Dictionary<string, IOpenApiSchema>
        {
            ["type"] = Text("A link to the HTTP status in RFC 9110."),
            ["title"] = Text("The HTTP status name, for example Conflict."),
            ["status"] = new OpenApiSchema { Type = JsonSchemaType.Integer, Format = "int32", Description = "The HTTP status code." },
            ["detail"] = Text("A sentence that explains the error."),
            ["code"] = Text("A stable code for the app, for example user.email_taken. Field errors have validation."),
            ["errors"] = new OpenApiSchema
            {
                Type = JsonSchemaType.Object,
                Description = "Only when the code is validation: messages per field, with field names as in the request.",
                AdditionalProperties = new OpenApiSchema { Type = JsonSchemaType.Array, Items = new OpenApiSchema { Type = JsonSchemaType.String } },
            },
            ["traceId"] = Text("Finds the request in the logs."),
        };
        schema.Required = new HashSet<string> { "type", "title", "status", "detail", "code", "traceId" };

        return Task.CompletedTask;
    }

    private static OpenApiSchema Text(string description) => new() { Type = JsonSchemaType.String, Description = description };
}
