using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Sessions.RevokeSession;

internal static class RevokeSessionEndpoint
{
    internal const string Name = "RevokeSession";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(SessionRoutes.Revoke, HandleAsync)
            .WithName(Name)
            .WithTags(SessionRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(SessionRoutes.RevokeRateLimit);
    }

    [EndpointSummary("Sign out")]
    [EndpointDescription("Deletes the refresh token of the device signing out. It needs no access token, because the refresh token proves it.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The token no longer works.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The token is missing.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] RevokeSessionRequest request,
        [FromServices] RevokeSessionHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
