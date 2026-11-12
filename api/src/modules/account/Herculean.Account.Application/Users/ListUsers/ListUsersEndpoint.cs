using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.ListUsers;

internal static class ListUsersEndpoint
{
    internal const string Name = "ListUsers";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(UserRoutes.AdminUsers, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.AdminTag);
    }

    [EndpointSummary("List users")]
    [EndpointDescription("Users, not admins, 20 a page: the newest first, or those waiting for deletion, the soonest first. A search matches part of a name or email. Admins only.")]
    [ProducesResponseType<UsersPageResponse>(StatusCodes.Status200OK, Description = "The page, which can be empty.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<Ok<UsersPageResponse>, ProblemHttpResult>> HandleAsync(
        [AsParameters] ListUsersRequest request,
        [FromServices] ListUsersHandler handler,
        CancellationToken cancellationToken)
    {
        Result<UsersPageResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
