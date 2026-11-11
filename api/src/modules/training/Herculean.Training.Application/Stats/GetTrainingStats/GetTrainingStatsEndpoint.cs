using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Stats.GetTrainingStats;

internal static class GetTrainingStatsEndpoint
{
    internal const string Name = "GetTrainingStats";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(StatsRoutes.Stats, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StatsRoutes.Tag);
    }

    [EndpointSummary("Count the training")]
    [EndpointDescription("Active users and finished workouts this week and each week for 4 weeks, counted over every user. Admins only.")]
    [ProducesResponseType<TrainingStatsResponse>(StatusCodes.Status200OK, Description = "The counts.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Ok<TrainingStatsResponse>> HandleAsync(
        [FromServices] GetTrainingStatsHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
