using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Records.ListRecentRecords;

internal static class ListRecentRecordsEndpoint
{
    internal const string Name = "ListRecentRecords";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(RecordRoutes.Recent, HandleAsync)
            .WithName(Name)
            .WithTags(RecordRoutes.Tag);
    }

    [EndpointSummary("List recent records")]
    [EndpointDescription("Returns up to three exercises whose heaviest weight was beaten in the last 30 days, newest first. The first time an exercise is done isn't a record, and neither is a bodyweight set.")]
    [ProducesResponseType<List<RecentRecordResponse>>(StatusCodes.Status200OK, Description = "The records. Empty when there are none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<List<RecentRecordResponse>>> HandleAsync(
        [FromServices] ListRecentRecordsHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
