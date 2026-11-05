using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.RestoreWorkout;

internal static class RestoreWorkoutEndpoint
{
    internal const string Name = "RestoreWorkout";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(WorkoutRoutes.RestoreWorkout, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Restore a workout")]
    [EndpointDescription("Brings a deleted workout back on its date, as it was.")]
    [ProducesResponseType<WorkoutResponse>(StatusCodes.Status200OK, Description = "The restored workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout does not exist, is not deleted, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Its date has another workout now, or another workout is in progress.")]
    private static async Task<Results<Ok<WorkoutResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromServices] RestoreWorkoutHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
