using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.ListExercises;

internal static class ListExercisesEndpoint
{
    internal const string Name = "ListExercises";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(ExerciseRoutes.Exercises, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("List the exercises")]
    [EndpointDescription("Returns the signed-in user's exercises by group order, then name. Search and group narrow the list. Deleted exercises are left out.")]
    [ProducesResponseType<List<ExerciseListItemResponse>>(StatusCodes.Status200OK, Description = "The exercises. Empty when none match.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The search is too long, or the group is not a valid ID.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Results<Ok<List<ExerciseListItemResponse>>, ProblemHttpResult>> HandleAsync(
        [AsParameters] ListExercisesRequest request,
        [FromServices] ListExercisesHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<ExerciseListItemResponse>> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
