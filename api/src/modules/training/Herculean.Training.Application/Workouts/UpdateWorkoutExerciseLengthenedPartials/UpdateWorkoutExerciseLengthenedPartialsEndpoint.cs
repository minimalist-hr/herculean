using System.ComponentModel;

using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Workouts.GetWorkout;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseLengthenedPartials;

internal static class UpdateWorkoutExerciseLengthenedPartialsEndpoint
{
    internal const string Name = "UpdateWorkoutExerciseLengthenedPartials";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(WorkoutRoutes.ExerciseLengthenedPartials, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Turn lengthened partials on or off in a workout")]
    [EndpointDescription("Turns lengthened partials on or off for an exercise of a workout in progress. The routine doesn't change.")]
    [ProducesResponseType<WorkoutDetailsResponse>(StatusCodes.Status200OK, Description = "The workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout or the exercise does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress.")]
    private static async Task<Results<Ok<WorkoutDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromRoute, Description("The exercise's ID in the workout.")] Guid workoutExerciseId,
        [FromBody] UpdateWorkoutExerciseLengthenedPartialsRequest request,
        [FromServices] UpdateWorkoutExerciseLengthenedPartialsHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutDetailsResponse> result = await handler.HandleAsync(id, workoutExerciseId, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
