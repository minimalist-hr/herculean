using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Days.ListDays;

internal static class ListDaysEndpoint
{
    internal const string Name = "ListDays";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(DayRoutes.Days, HandleAsync)
            .WithName(Name)
            .WithTags(DayRoutes.Tag);
    }

    [EndpointSummary("List days")]
    [EndpointDescription("Returns each date's status from the first date to the last, for the signed-in user, in their time zone.")]
    [ProducesResponseType<List<DaySummaryResponse>>(StatusCodes.Status200OK, Description = "The days, in order.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A date is missing or not valid, the last date is before the first, or the range is over 42 days.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Results<Ok<List<DaySummaryResponse>>, ProblemHttpResult>> HandleAsync(
        [AsParameters] ListDaysRequest request,
        [FromServices] ListDaysHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<DaySummaryResponse>> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
