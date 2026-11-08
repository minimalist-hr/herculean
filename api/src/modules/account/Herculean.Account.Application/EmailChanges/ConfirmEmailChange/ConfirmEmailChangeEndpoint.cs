using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.EmailChanges.ConfirmEmailChange;

internal static class ConfirmEmailChangeEndpoint
{
    internal const string Name = "ConfirmEmailChange";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(EmailChangeRoutes.Confirm, HandleAsync)
            .WithName(Name)
            .WithTags(EmailChangeRoutes.Tag)
            .AllowAnonymous()
            .RequireRateLimiting(EmailChangeRoutes.ConfirmRateLimit);
    }

    [EndpointSummary("Confirm a new email")]
    [EndpointDescription("Makes the new email active with the token from the link. It needs no sign in, because the link can be opened on another device or while signed out.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The email is changed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "The token is missing.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The token is unknown, already used or expired. Send a new link.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Another account took this email after the link was sent.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] ConfirmEmailChangeRequest request,
        [FromServices] ConfirmEmailChangeHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
