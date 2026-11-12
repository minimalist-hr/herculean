using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Training.Application.Starter.DeleteStarterExercise;

internal static class DeleteStarterExerciseEndpoint
{
    internal const string Name = "DeleteStarterExercise";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(StarterRoutes.Exercise, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(StarterRoutes.Tag);
    }

    [EndpointSummary("Delete a starter exercise")]
    [EndpointDescription("Removes an exercise from what new accounts start with. Accounts already made keep theirs. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The starter exercise is gone.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no starter exercise with this ID.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] DeleteStarterExerciseHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
