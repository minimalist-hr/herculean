using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.SignOutUser;

internal static class SignOutUserEndpoint
{
    internal const string Name = "SignOutUser";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(UserRoutes.AdminUserSessions, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.AdminTag);
    }

    [EndpointSummary("Sign a user out everywhere")]
    [EndpointDescription("Signs the user out on every device, so each has to sign in again. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "Signed out everywhere.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no user with this ID. Admins aren't users here.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] SignOutUserHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
