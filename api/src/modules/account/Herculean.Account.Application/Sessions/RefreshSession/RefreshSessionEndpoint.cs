using Herculean.Account.Application.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Sessions.RefreshSession;

internal static class RefreshSessionEndpoint
{
    internal const string Name = "RefreshSession";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(SessionRoutes.Refresh, HandleAsync)
            .WithName(Name)
            .WithTags(SessionRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(SessionRoutes.RefreshRateLimit);
    }

    [EndpointSummary("Refresh the tokens")]
    [EndpointDescription("Swaps a refresh token for a new access token and a new refresh token. The old refresh token stops working.")]
    [ProducesResponseType<TokenResponse>(StatusCodes.Status200OK, Description = "New tokens. Keep the new refresh token; the old one no longer works.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The refresh token is missing.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "The refresh token is unknown, already used or expired. Sign in again.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<Ok<TokenResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] RefreshSessionRequest request,
        [FromServices] RefreshSessionHandler handler,
        CancellationToken cancellationToken)
    {
        Result<TokenResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
