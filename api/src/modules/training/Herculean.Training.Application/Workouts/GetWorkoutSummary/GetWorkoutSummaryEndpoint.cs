using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.GetWorkoutSummary;

internal static class GetWorkoutSummaryEndpoint
{
    internal const string Name = "GetWorkoutSummary";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(WorkoutRoutes.Summary, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Get a workout's summary")]
    [EndpointDescription("Returns what one of the signed-in user's workouts comes to: its duration, sets, volume, unchecked exercises and new records.")]
    [ProducesResponseType<WorkoutSummaryResponse>(StatusCodes.Status200OK, Description = "The summary.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<WorkoutSummaryResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromServices] GetWorkoutSummaryHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutSummaryResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
