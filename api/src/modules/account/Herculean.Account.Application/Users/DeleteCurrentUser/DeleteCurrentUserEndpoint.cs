using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.DeleteCurrentUser;

internal static class DeleteCurrentUserEndpoint
{
    internal const string Name = "DeleteCurrentUser";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(UserRoutes.Me, HandleAsync)
            .WithName(Name)
            .WithTags(UserRoutes.Tag)
            .RequireRateLimiting(UserRoutes.DeleteCurrentUserRateLimit);
    }

    [EndpointSummary("Delete the signed-in user")]
    [EndpointDescription("Checks the current password and deletes the account and everything in it, for good. A last email tells the user.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The account is deleted.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The password is missing or wrong. The errors name the field.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] DeleteCurrentUserRequest request,
        [FromServices] DeleteCurrentUserHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
