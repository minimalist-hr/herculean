using System.ComponentModel;

using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.UpdateExercise;

internal static class UpdateExerciseEndpoint
{
    internal const string Name = "UpdateExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(ExerciseRoutes.Exercise, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("Change an exercise")]
    [EndpointDescription("Replaces the name, the group and the other groups an exercise also works. Changes show everywhere it is used.")]
    [ProducesResponseType<ExerciseResponse>(StatusCodes.Status200OK, Description = "The changed exercise.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The exercise or one of the groups does not exist.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The user already has another exercise with this name.")]
    private static async Task<Results<Ok<ExerciseResponse>, ProblemHttpResult>> HandleAsync(
        [FromRoute, Description("The exercise's ID.")] Guid id,
        [FromBody] UpdateExerciseRequest request,
        [FromServices] UpdateExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ExerciseResponse> result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
