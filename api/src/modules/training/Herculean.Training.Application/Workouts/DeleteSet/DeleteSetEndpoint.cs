using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.DeleteSet;

internal static class DeleteSetEndpoint
{
    internal const string Name = "DeleteSet";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(WorkoutRoutes.Set, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Remove a set")]
    [EndpointDescription("Removes a set from an exercise in a workout in progress, and closes the gap in the order. An exercise keeps at least one set.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The set is removed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout, exercise or set does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress, or this is the exercise's last set.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromRoute, Description("The exercise's ID in the workout.")] Guid workoutExerciseId,
        [FromRoute, Description("The set's ID.")] Guid setId,
        [FromServices] DeleteSetHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, workoutExerciseId, setId, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
