using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Days.GetMonthSummary;

internal static class GetMonthSummaryEndpoint
{
    internal const string Name = "GetMonthSummary";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(DayRoutes.MonthSummary, HandleAsync)
            .WithName(Name)
            .WithTags(DayRoutes.Tag);
    }

    [EndpointSummary("Get a month's summary")]
    [EndpointDescription("Returns a month's counts and totals for the signed-in user, in their time zone.")]
    [ProducesResponseType<MonthSummaryResponse>(StatusCodes.Status200OK, Description = "The month's summary.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The month is not a valid month.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Results<Ok<MonthSummaryResponse>, ProblemHttpResult>> HandleAsync(
        [AsParameters] GetMonthSummaryRequest request,
        [FromServices] GetMonthSummaryHandler handler,
        CancellationToken cancellationToken)
    {
        Result<MonthSummaryResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
