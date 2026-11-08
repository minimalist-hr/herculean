using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Days.GetStreak;

internal static class GetStreakEndpoint
{
    internal const string Name = "GetStreak";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(DayRoutes.Streak, HandleAsync)
            .WithName(Name)
            .WithTags(DayRoutes.Tag);
    }

    [EndpointSummary("Get the streak")]
    [EndpointDescription("Returns how many finished weeks in a row the signed-in user kept to their plan.")]
    [ProducesResponseType<StreakResponse>(StatusCodes.Status200OK, Description = "The streak.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<StreakResponse>> HandleAsync(
        [FromServices] GetStreakHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
