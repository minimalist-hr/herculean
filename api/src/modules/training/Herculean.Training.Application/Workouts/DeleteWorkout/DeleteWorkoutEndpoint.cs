using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.DeleteWorkout;

internal static class DeleteWorkoutEndpoint
{
    internal const string Name = "DeleteWorkout";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(WorkoutRoutes.Workout, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Delete a workout")]
    [EndpointDescription("Removes a workout from the signed-in user's date, which is how a skip is undone. The day then reads from the week plan again.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The workout is deleted.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout does not exist, is already deleted, or belongs to another user.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromServices] DeleteWorkoutHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
