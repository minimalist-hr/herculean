using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.EmailChanges.ResendEmailChange;

internal static class ResendEmailChangeEndpoint
{
    internal const string Name = "ResendEmailChange";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(EmailChangeRoutes.Resend, HandleAsync)
            .WithName(Name)
            .WithTags(EmailChangeRoutes.Tag)
            .RequireRateLimiting(EmailChangeRoutes.ResendRateLimit);
    }

    [EndpointSummary("Send the email change link again")]
    [EndpointDescription("Sends a new link to the address that is waiting. The older link stops working.")]
    [ProducesResponseType(StatusCodes.Status202Accepted, Description = "Accepted. The link is on its way.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists, or no email change is waiting.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<Accepted, ProblemHttpResult>> HandleAsync(
        [FromServices] ResendEmailChangeHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Accepted(uri: (string?)null) : result.Error.ToProblem();
    }
}
