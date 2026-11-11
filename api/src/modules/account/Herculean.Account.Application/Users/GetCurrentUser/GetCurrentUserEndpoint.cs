using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.GetCurrentUser;

internal static class GetCurrentUserEndpoint
{
    internal const string Name = "GetCurrentUser";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        // An admin reads itself too, to know it is one.
        endpoints.MapGet(UserRoutes.Me, HandleAsync)
            .RequireAuthorization()
            .WithName(Name)
            .WithTags(UserRoutes.Tag);
    }

    [EndpointSummary("Get the signed-in user")]
    [EndpointDescription("Returns the signed-in account, a user or an admin. A user without a name has not finished setup.")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK, Description = "The signed-in user.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    private static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> HandleAsync(
        [FromServices] GetCurrentUserHandler handler,
        CancellationToken cancellationToken)
    {
        Result<UserResponse> result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
