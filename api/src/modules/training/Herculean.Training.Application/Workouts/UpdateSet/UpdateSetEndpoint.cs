using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.UpdateSet;

internal static class UpdateSetEndpoint
{
    internal const string Name = "UpdateSet";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPatch(WorkoutRoutes.Set, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Change a set")]
    [EndpointDescription("Changes a set's weight or reps, or checks or unchecks it, in a workout in progress. A changed value also changes later unchecked sets of the exercise, unless they were changed by hand. Returns all of the exercise's sets.")]
    [ProducesResponseType<List<SetResponse>>(StatusCodes.Status200OK, Description = "All of the exercise's sets, in order.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout, exercise or set does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress.")]
    private static async Task<Results<Ok<List<SetResponse>>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromRoute, Description("The exercise's ID in the workout.")] Guid workoutExerciseId,
        [FromRoute, Description("The set's ID.")] Guid setId,
        [FromBody] UpdateSetRequest request,
        [FromServices] UpdateSetHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<SetResponse>> result = await handler.HandleAsync(id, workoutExerciseId, setId, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
