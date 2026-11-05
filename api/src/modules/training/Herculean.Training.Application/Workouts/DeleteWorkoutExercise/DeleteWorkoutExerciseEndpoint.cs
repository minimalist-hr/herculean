using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.DeleteWorkoutExercise;

internal static class DeleteWorkoutExerciseEndpoint
{
    internal const string Name = "DeleteWorkoutExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(WorkoutRoutes.Exercise, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Remove an exercise from a workout")]
    [EndpointDescription("Removes an exercise and its sets from a workout in progress, and closes the gap in the order. The last one can go too.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The exercise is removed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout or the exercise does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromRoute, Description("The exercise's ID in the workout.")] Guid workoutExerciseId,
        [FromServices] DeleteWorkoutExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, workoutExerciseId, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
