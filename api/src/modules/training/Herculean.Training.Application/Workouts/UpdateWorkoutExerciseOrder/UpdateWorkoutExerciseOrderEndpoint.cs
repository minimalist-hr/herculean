using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseOrder;

internal static class UpdateWorkoutExerciseOrderEndpoint
{
    internal const string Name = "UpdateWorkoutExerciseOrder";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(WorkoutRoutes.ExerciseOrder, HandleAsync)
            .WithName(Name)
            .WithTags(WorkoutRoutes.Tag);
    }

    [EndpointSummary("Reorder a workout's exercises")]
    [EndpointDescription("Puts the exercises of a workout in progress in this order. It has to name each of them once.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The order is saved.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The workout does not exist, or belongs to another user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The workout is not in progress, or its exercises have changed.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The workout's ID.")] Guid id,
        [FromBody] UpdateWorkoutExerciseOrderRequest request,
        [FromServices] UpdateWorkoutExerciseOrderHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
