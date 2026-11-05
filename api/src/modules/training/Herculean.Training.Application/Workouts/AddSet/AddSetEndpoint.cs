using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.AddSet;

internal static class AddSetEndpoint
{
    internal const string Name = "AddSet";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(WorkoutRoutes.Sets, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Add a set")]
    [EndpointDescription("Adds a set to an exercise in a workout in progress. An empty object adds a copy of the last set. Sending a removed set puts it back where it was. An exercise has at most 20 sets.")]
    [ProducesResponseType<SetResponse>(StatusCodes.Status201Created, Description = "The new set.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout or the exercise does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress, or the exercise has 20 sets.")]
    private static async Task<Results<Created<SetResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromRoute, Description("The exercise's ID in the workout.")] Guid workoutExerciseId,
        [FromBody] AddSetRequest request,
        [FromServices] AddSetHandler handler,
        CancellationToken cancellationToken)
    {
        Result<SetResponse> result = await handler.HandleAsync(id, workoutExerciseId, request, cancellationToken);

        return result.IsSuccess
            ? TypedResults.Created($"{WorkoutRoutes.Workouts}/{id}/exercises/{workoutExerciseId}/sets/{result.Value.Id}", result.Value)
            : result.Error.ToProblem();
    }
}
