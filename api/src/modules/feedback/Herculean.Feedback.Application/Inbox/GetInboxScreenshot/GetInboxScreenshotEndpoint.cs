using Herculean.Feedback.Application.Tickets.GetScreenshot;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Inbox.GetInboxScreenshot;

internal static class GetInboxScreenshotEndpoint
{
    internal const string Name = "GetInboxScreenshot";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(InboxRoutes.Screenshot, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.Tag);
    }

    [EndpointSummary("Get a screenshot in the inbox")]
    [EndpointDescription("One screenshot on any user's ticket. Admins only.")]
    [ProducesResponseType<ScreenshotResponse>(StatusCodes.Status200OK, Description = "The screenshot.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no such screenshot on this ticket.")]
    private static async Task<Results<Ok<ScreenshotResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        Guid screenshotId,
        [FromServices] GetInboxScreenshotHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ScreenshotResponse> result = await handler.HandleAsync(id, screenshotId, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
