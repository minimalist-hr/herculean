using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.CreateExercise;

internal static class CreateExerciseEndpoint
{
    internal const string Name = "CreateExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(ExerciseRoutes.Exercises, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("Create an exercise")]
    [EndpointDescription("Adds an exercise to the signed-in user's list, in a group and with any other groups it also works.")]
    [ProducesResponseType<ExerciseResponse>(StatusCodes.Status201Created, Description = "The new exercise.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "One of the groups does not exist.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The user already has an exercise with this name, or has reached the limit of 500 exercises.")]
    private static async Task<Results<Created<ExerciseResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] CreateExerciseRequest request,
        [FromServices] CreateExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ExerciseResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess
            ? TypedResults.Created($"{ExerciseRoutes.Exercises}/{result.Value.Id}", result.Value)
            : result.Error.ToProblem();
    }
}
