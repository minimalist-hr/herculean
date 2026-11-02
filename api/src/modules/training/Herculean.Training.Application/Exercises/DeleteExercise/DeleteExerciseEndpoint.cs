using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.DeleteExercise;

internal static class DeleteExerciseEndpoint
{
    internal const string Name = "DeleteExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(ExerciseRoutes.Exercise, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("Delete an exercise")]
    [EndpointDescription("Removes an exercise from the signed-in user's list and routines. Logged workouts keep it, and its name can be used again.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The exercise is deleted.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The exercise does not exist, is already deleted, or belongs to another user.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The exercise's ID.")] Guid id,
        [FromServices] DeleteExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
