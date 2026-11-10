using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Export.GetExport;

internal static class GetExportEndpoint
{
    internal const string Name = "GetExport";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(ExportRoutes.Export, HandleAsync)
            .WithName(Name)
            .WithTags(ExportRoutes.Tag);
    }

    [EndpointSummary("Export the training data")]
    [EndpointDescription("Returns every exercise, routine and workout of the signed-in user, for a copy of their data. Deleted ones are left out.")]
    [ProducesResponseType<ExportResponse>(StatusCodes.Status200OK, Description = "The data.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<ExportResponse>> HandleAsync(
        [FromServices] GetExportHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
