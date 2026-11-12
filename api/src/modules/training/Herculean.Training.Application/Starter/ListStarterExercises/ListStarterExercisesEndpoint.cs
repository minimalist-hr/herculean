using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Starter.ListStarterExercises;

internal static class ListStarterExercisesEndpoint
{
    internal const string Name = "ListStarterExercises";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(StarterRoutes.Exercises, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StarterRoutes.Tag);
    }

    [EndpointSummary("List starter exercises")]
    [EndpointDescription("Every exercise a new account starts with, in the order they were made. Admins only.")]
    [ProducesResponseType<List<StarterExerciseResponse>>(StatusCodes.Status200OK, Description = "The starter exercises, which can be none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<Ok<List<StarterExerciseResponse>>, ProblemHttpResult>> HandleAsync(
        [FromServices] ListStarterExercisesHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<StarterExerciseResponse>> result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
