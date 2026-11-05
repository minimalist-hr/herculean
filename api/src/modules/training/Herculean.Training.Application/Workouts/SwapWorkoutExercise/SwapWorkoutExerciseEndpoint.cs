using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Herculean.Training.Application.Workouts.GetWorkout;

namespace Herculean.Training.Application.Workouts.SwapWorkoutExercise;

internal static class SwapWorkoutExerciseEndpoint
{
    internal const string Name = "SwapWorkoutExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPatch(WorkoutRoutes.Exercise, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Swap an exercise in a workout")]
    [EndpointDescription("Swaps an exercise with no checked sets for another, keeping the set count and targets. Its sets start from the new exercise's last time. Sending the sets' earlier values puts them back, which is how a swap is undone.")]
    [ProducesResponseType<WorkoutDetailsResponse>(StatusCodes.Status200OK, Description = "The workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout or an exercise does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress, already has the new exercise, or the exercise has checked sets.")]
    private static async Task<Results<Ok<WorkoutDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromRoute, Description("The exercise's ID in the workout.")] Guid workoutExerciseId,
        [FromBody] SwapWorkoutExerciseRequest request,
        [FromServices] SwapWorkoutExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutDetailsResponse> result = await handler.HandleAsync(id, workoutExerciseId, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
