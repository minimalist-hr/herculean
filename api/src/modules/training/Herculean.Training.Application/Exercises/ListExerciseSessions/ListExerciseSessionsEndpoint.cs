using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.ListExerciseSessions;

internal static class ListExerciseSessionsEndpoint
{
    internal const string Name = "ListExerciseSessions";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(ExerciseRoutes.Sessions, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("List an exercise's sessions")]
    [EndpointDescription("Returns 20 of the completed workouts with checked sets of one of the signed-in user's exercises, newest first, with the months they're in. Pass nextCursor as cursor for the next 20.")]
    [ProducesResponseType<ExerciseSessionsResponse>(StatusCodes.Status200OK, Description = "A page of sessions. Empty when the exercise hasn't been done.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The cursor isn't one from an earlier page.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The exercise does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<ExerciseSessionsResponse>, ProblemHttpResult>> HandleAsync(
        [AsParameters] ListExerciseSessionsRequest request,
        [FromServices] ListExerciseSessionsHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ExerciseSessionsResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
