using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Starter.CreateStarterExercise;

internal static class CreateStarterExerciseEndpoint
{
    internal const string Name = "CreateStarterExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(StarterRoutes.Exercises, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StarterRoutes.Tag);
    }

    [EndpointSummary("Create a starter exercise")]
    [EndpointDescription("Adds an exercise to what new accounts start with. Accounts already made keep theirs. At most 500. Admins only.")]
    [ProducesResponseType<StarterCreatedResponse>(StatusCodes.Status200OK, Description = "The starter exercise's ID.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "A starter group does not exist.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "There are 500 starter exercises already, or one has this name.")]
    private static async Task<Results<Ok<StarterCreatedResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] SaveStarterExerciseRequest request,
        [FromServices] CreateStarterExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result<StarterCreatedResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
