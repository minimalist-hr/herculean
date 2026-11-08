using Herculean.Account.Application.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Sessions.RestoreAccount;

internal static class RestoreAccountEndpoint
{
    internal const string Name = "RestoreAccount";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(SessionRoutes.Restore, HandleAsync)
            .WithName(Name)
            .WithTags(SessionRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(SessionRoutes.RestoreRateLimit);
    }

    [EndpointSummary("Keep an account and sign in")]
    [EndpointDescription("Cancels a scheduled deletion and signs in with email and password.")]
    [ProducesResponseType<TokenResponse>(StatusCodes.Status200OK, Description = "The account is kept, and signed in.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The email or password is missing.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "The email or password is wrong. The message never says which.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<Ok<TokenResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] RestoreAccountRequest request,
        [FromServices] RestoreAccountHandler handler,
        CancellationToken cancellationToken)
    {
        Result<TokenResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
