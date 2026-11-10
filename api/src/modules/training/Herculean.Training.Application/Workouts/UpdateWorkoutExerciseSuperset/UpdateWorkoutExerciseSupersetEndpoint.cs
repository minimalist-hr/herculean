using System.ComponentModel;

using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseSuperset;

internal static class UpdateWorkoutExerciseSupersetEndpoint
{
    internal const string Name = "UpdateWorkoutExerciseSuperset";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(WorkoutRoutes.ExerciseSuperset, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Start or end a superset in a workout")]
    [EndpointDescription("Pairs an exercise of a workout in progress with the exercise after it, or ends its superset.")]
    [ProducesResponseType<WorkoutDetailsResponse>(StatusCodes.Status200OK, Description = "The workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout or the exercise does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress, or the superset wouldn't be two exercises next to each other.")]
    private static async Task<Results<Ok<WorkoutDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromRoute, Description("The exercise's ID in the workout.")] Guid workoutExerciseId,
        [FromBody] UpdateWorkoutExerciseSupersetRequest request,
        [FromServices] UpdateWorkoutExerciseSupersetHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutDetailsResponse> result = await handler.HandleAsync(id, workoutExerciseId, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
