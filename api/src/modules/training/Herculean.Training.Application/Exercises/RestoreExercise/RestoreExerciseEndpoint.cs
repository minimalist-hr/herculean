using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.RestoreExercise;

internal static class RestoreExerciseEndpoint
{
    internal const string Name = "RestoreExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(ExerciseRoutes.RestoreExercise, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("Restore an exercise")]
    [EndpointDescription("Brings a deleted exercise back to the signed-in user's list.")]
    [ProducesResponseType<ExerciseResponse>(StatusCodes.Status200OK, Description = "The restored exercise.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The exercise does not exist, is not deleted, or belongs to another user, or one of its groups is gone.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Another exercise has its name now.")]
    private static async Task<Results<Ok<ExerciseResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The exercise's ID.")] Guid id,
        [FromServices] RestoreExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ExerciseResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
