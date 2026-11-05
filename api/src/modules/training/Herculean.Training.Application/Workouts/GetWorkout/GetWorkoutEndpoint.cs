using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.GetWorkout;

internal static class GetWorkoutEndpoint
{
    internal const string Name = "GetWorkout";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(WorkoutRoutes.Workout, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Get a workout")]
    [EndpointDescription("Returns one of the signed-in user's workouts, with its exercises and sets in order, and each exercise's last time.")]
    [ProducesResponseType<WorkoutDetailsResponse>(StatusCodes.Status200OK, Description = "The workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<WorkoutDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromServices] GetWorkoutHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutDetailsResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
