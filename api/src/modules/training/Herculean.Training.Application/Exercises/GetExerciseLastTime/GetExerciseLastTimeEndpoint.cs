using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Exercises.GetExerciseLastTime;

internal static class GetExerciseLastTimeEndpoint
{
    internal const string Name = "GetExerciseLastTime";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(ExerciseRoutes.LastTime, HandleAsync)
            .WithName(Name)
            .WithTags(ExerciseRoutes.Tag);
    }

    [EndpointSummary("Get an exercise's last time")]
    [EndpointDescription("Returns the sets of one of the signed-in user's exercises in its latest completed workout before a date.")]
    [ProducesResponseType<ExerciseLastTimeResponse>(StatusCodes.Status200OK, Description = "Its last time, or null when it wasn't done before the date.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The exercise does not exist, is deleted, or belongs to another user.")]
    private static async Task<Results<Ok<ExerciseLastTimeResponse>, ProblemHttpResult>> HandleAsync(
        [AsParameters] GetExerciseLastTimeRequest request,
        [FromServices] GetExerciseLastTimeHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ExerciseLastTimeResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
