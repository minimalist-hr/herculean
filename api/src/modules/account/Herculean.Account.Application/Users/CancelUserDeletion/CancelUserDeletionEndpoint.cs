using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.CancelUserDeletion;

internal static class CancelUserDeletionEndpoint
{
    internal const string Name = "CancelUserDeletion";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(UserRoutes.AdminUserDeletion, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.AdminTag);
    }

    [EndpointSummary("Cancel a user's deletion")]
    [EndpointDescription("Keeps an account that was waiting for deletion. The user signs in again as before. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The account stays.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no user with this ID. Admins aren't users here.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] CancelUserDeletionHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
