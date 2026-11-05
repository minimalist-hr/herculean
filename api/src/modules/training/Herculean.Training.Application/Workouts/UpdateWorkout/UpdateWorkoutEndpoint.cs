using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.UpdateWorkout;

internal static class UpdateWorkoutEndpoint
{
    internal const string Name = "UpdateWorkout";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPatch(WorkoutRoutes.Workout, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Update a workout")]
    [EndpointDescription("Saves a workout in progress as completed. Unchecked sets are removed, and so is any exercise left with no sets.")]
    [ProducesResponseType<WorkoutResponse>(StatusCodes.Status200OK, Description = "The saved workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout does not exist, is deleted, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress, or none of its sets are checked.")]
    private static async Task<Results<Ok<WorkoutResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromBody] UpdateWorkoutRequest request,
        [FromServices] UpdateWorkoutHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutResponse> result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
