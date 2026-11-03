using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Days.GetDay;

internal static class GetDayEndpoint
{
    internal const string Name = "GetDay";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(DayRoutes.Day, HandleAsync)
            .WithName(Name)
            .WithTags(DayRoutes.Tag);
    }

    [EndpointSummary("Get a day")]
    [EndpointDescription("Returns a date's status for the signed-in user, in their time zone, with its routine and the day after it.")]
    [ProducesResponseType<DayResponse>(StatusCodes.Status200OK, Description = "The day.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The date is not a valid date.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<DayResponse>> HandleAsync(
        [FromRoute] DateOnly date,
        [FromServices] GetDayHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(date, cancellationToken));
    }
}
