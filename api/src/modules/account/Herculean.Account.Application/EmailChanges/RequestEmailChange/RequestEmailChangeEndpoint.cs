using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.EmailChanges.RequestEmailChange;

internal static class RequestEmailChangeEndpoint
{
    internal const string Name = "RequestEmailChange";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(EmailChangeRoutes.EmailChanges, HandleAsync)
            .WithName(Name)
            .WithTags(EmailChangeRoutes.Tag)
            .RequireRateLimiting(EmailChangeRoutes.RequestRateLimit);
    }

    [EndpointSummary("Ask to change the email")]
    [EndpointDescription("Checks the current password and sends a link to the new address. The email changes only when the link is opened, and a new request cancels an older link.")]
    [ProducesResponseType(StatusCodes.Status202Accepted, Description = "Accepted. The link is on its way.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid, the current password is wrong, or it is already this user's email. The errors name each field.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "Another account uses this email.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<Accepted, ProblemHttpResult>> HandleAsync(
        [FromBody] RequestEmailChangeRequest request,
        [FromServices] RequestEmailChangeHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Accepted(uri: (string?)null) : result.Error.ToProblem();
    }
}
