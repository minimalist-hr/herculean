using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.GetExerciseProgress;

internal static class GetExerciseProgressEndpoint
{
    internal const string Name = "GetExerciseProgress";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(ExerciseRoutes.Progress, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("Get an exercise's progress")]
    [EndpointDescription("Returns the heaviest set of each completed workout with checked sets of one of the signed-in user's exercises, over a range up to today, oldest first. A range with more than 60 sessions returns each month's heaviest set instead.")]
    [ProducesResponseType<ExerciseProgressResponse>(StatusCodes.Status200OK, Description = "The heaviest sets. Empty when the range has no sessions.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The range isn't 3m, 6m, 1y or all.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The exercise does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<ExerciseProgressResponse>, ProblemHttpResult>> HandleAsync(
        [AsParameters] GetExerciseProgressRequest request,
        [FromServices] GetExerciseProgressHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ExerciseProgressResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
