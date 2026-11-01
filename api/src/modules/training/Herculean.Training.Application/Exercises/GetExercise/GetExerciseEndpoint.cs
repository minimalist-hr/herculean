using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.GetExercise;

internal static class GetExerciseEndpoint
{
    internal const string Name = "GetExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(ExerciseRoutes.Exercise, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("Get an exercise")]
    [EndpointDescription("Returns one of the signed-in user's exercises, with its group and the other groups it also works.")]
    [ProducesResponseType<ExerciseDetailsResponse>(StatusCodes.Status200OK, Description = "The exercise.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The exercise does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<ExerciseDetailsResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The exercise's ID.")] Guid id,
        [FromServices] GetExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ExerciseDetailsResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
