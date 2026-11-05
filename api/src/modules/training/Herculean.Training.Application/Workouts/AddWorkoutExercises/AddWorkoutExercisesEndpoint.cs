using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Herculean.Training.Application.Workouts.GetWorkout;

namespace Herculean.Training.Application.Workouts.AddWorkoutExercises;

internal static class AddWorkoutExercisesEndpoint
{
    internal const string Name = "AddWorkoutExercises";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(WorkoutRoutes.Exercises, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Add exercises to a workout")]
    [EndpointDescription("Adds exercises at the end of a workout in progress, at 3 × 8–10, with sets from last time. Sending a removed exercise instead puts it back where it was, with its sets. A workout has at most 30 exercises, each once.")]
    [ProducesResponseType<WorkoutDetailsResponse>(StatusCodes.Status200OK, Description = "The workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout or an exercise does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress, has no room, or already has one of the exercises.")]
    private static async Task<Results<Ok<WorkoutDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromBody] AddWorkoutExercisesRequest request,
        [FromServices] AddWorkoutExercisesHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutDetailsResponse> result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
