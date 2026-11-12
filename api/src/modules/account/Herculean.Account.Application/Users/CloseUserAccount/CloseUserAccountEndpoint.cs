using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.CloseUserAccount;

internal static class CloseUserAccountEndpoint
{
    internal const string Name = "CloseUserAccount";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(UserRoutes.AdminUserDeletion, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.AdminTag);
    }

    [EndpointSummary("Close a user's account")]
    [EndpointDescription("Closes an account that broke the terms: every device is signed out, it can't sign in, an email says why, and it gets deleted in 14 days unless the deletion is cancelled. An account the user already deleted keeps its date. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The account is closed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no user with this ID. Admins aren't users here.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] CloseUserAccountHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
