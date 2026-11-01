using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.PasswordResets.CreatePasswordReset;

internal static class CreatePasswordResetEndpoint
{
    internal const string Name = "CreatePasswordReset";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(PasswordResetRoutes.PasswordResets, HandleAsync)
            .WithName(Name)
            .WithTags(PasswordResetRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(PasswordResetRoutes.CreateRateLimit);
    }

    [EndpointSummary("Send a password reset link")]
    [EndpointDescription("Emails a link to set a new password. The answer is the same whether or not the email has an account, so it never tells which emails do. A new link cancels older ones.")]
    [ProducesResponseType(StatusCodes.Status202Accepted, Description = "Accepted. If the email has an account, the link is on its way.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The email is missing or not valid.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<Accepted, ProblemHttpResult>> HandleAsync(
        [FromBody] CreatePasswordResetRequest request,
        [FromServices] CreatePasswordResetHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Accepted(uri: (string?)null) : result.Error.ToProblem();
    }
}
