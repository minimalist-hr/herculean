using Herculean.Account.Application.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Sessions.CreateSession;

internal static class CreateSessionEndpoint
{
    internal const string Name = "CreateSession";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(SessionRoutes.Sessions, HandleAsync)
            .WithName(Name)
            .WithTags(SessionRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(SessionRoutes.SignInRateLimit);
    }

    // 200, not 201: like an OAuth 2.0 token endpoint, it hands out tokens rather than creating something to fetch later.
    [EndpointSummary("Sign in")]
    [EndpointDescription("Signs in with email and password and returns new tokens. The email can be in any case.")]
    [ProducesResponseType<TokenResponse>(StatusCodes.Status200OK, Description = "Signed in.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The email or password is missing.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "The email or password is wrong. The message never says which.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<Ok<TokenResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] CreateSessionRequest request,
        [FromServices] CreateSessionHandler handler,
        CancellationToken cancellationToken)
    {
        Result<TokenResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
