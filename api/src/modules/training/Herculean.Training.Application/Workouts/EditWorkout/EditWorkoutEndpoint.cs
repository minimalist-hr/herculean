using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.EditWorkout;

internal static class EditWorkoutEndpoint
{
    internal const string Name = "EditWorkout";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(WorkoutRoutes.Workout, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Edit a saved workout")]
    [EndpointDescription("Replaces a saved workout's exercises and sets with the ones sent, in their order. Exercises left out are removed; new ones get the starting targets. Every set counts as done.")]
    [ProducesResponseType<WorkoutResponse>(StatusCodes.Status200OK, Description = "The edited workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout, a workout exercise or an added exercise does not exist, is deleted, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout isn't saved.")]
    private static async Task<Results<Ok<WorkoutResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromBody] EditWorkoutRequest request,
        [FromServices] EditWorkoutHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutResponse> result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
