using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.CreateWorkout;

internal static class CreateWorkoutEndpoint
{
    internal const string Name = "CreateWorkout";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(WorkoutRoutes.Workouts, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Create a workout")]
    [EndpointDescription("Adds a skipped workout to a date for the signed-in user. The date is today or a past day with a routine planned, in the user's time zone. The workout takes the routine's name.")]
    [ProducesResponseType<WorkoutResponse>(StatusCodes.Status201Created, Description = "The new workout.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The date already has a workout, is in the future, or has no routine planned.")]
    private static async Task<Results<Created<WorkoutResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] CreateWorkoutRequest request,
        [FromServices] CreateWorkoutHandler handler,
        CancellationToken cancellationToken)
    {
        Result<WorkoutResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess
            ? TypedResults.Created($"{WorkoutRoutes.Workouts}/{result.Value.Id}", result.Value)
            : result.Error.ToProblem();
    }
}
