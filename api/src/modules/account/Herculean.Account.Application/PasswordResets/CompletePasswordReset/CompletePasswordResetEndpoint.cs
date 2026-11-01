using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.PasswordResets.CompletePasswordReset;

internal static class CompletePasswordResetEndpoint
{
    internal const string Name = "CompletePasswordReset";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(PasswordResetRoutes.Complete, HandleAsync)
            .WithName(Name)
            .WithTags(PasswordResetRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(PasswordResetRoutes.CompleteRateLimit);
    }

    [EndpointSummary("Set a new password")]
    [EndpointDescription("Sets the new password with the token from the reset link. The link stops working and every device is signed out.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The password is changed. Sign in with the new one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The token is missing, or the password is too short.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The token is unknown, already used or expired. Send a new link.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] CompletePasswordResetRequest request,
        [FromServices] CompletePasswordResetHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
