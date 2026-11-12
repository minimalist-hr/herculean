using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.GetUser;

internal static class GetUserEndpoint
{
    internal const string Name = "GetUser";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(UserRoutes.AdminUser, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.AdminTag);
    }

    [EndpointSummary("Get a user")]
    [EndpointDescription("A user's name, email, when they joined and were last active, and when the account gets deleted. Admins only.")]
    [ProducesResponseType<AdminUserResponse>(StatusCodes.Status200OK, Description = "The user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no user with this ID. Admins aren't users here.")]
    private static async Task<Results<Ok<AdminUserResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] GetUserHandler handler,
        CancellationToken cancellationToken)
    {
        Result<AdminUserResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
