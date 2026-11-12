using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Starter.UpdateStarterExercise;

internal static class UpdateStarterExerciseEndpoint
{
    internal const string Name = "UpdateStarterExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(StarterRoutes.Exercise, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StarterRoutes.Tag);
    }

    [EndpointSummary("Change a starter exercise")]
    [EndpointDescription("Changes a starter exercise's name and groups for accounts made from now on. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The starter exercise is changed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no starter exercise with this ID, or a starter group does not exist.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Another starter exercise has this name.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromBody] SaveStarterExerciseRequest request,
        [FromServices] UpdateStarterExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
