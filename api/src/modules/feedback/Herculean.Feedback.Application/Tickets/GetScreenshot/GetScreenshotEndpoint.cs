using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.GetScreenshot;

internal static class GetScreenshotEndpoint
{
    internal const string Name = "GetScreenshot";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(TicketRoutes.Screenshot, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("Get a screenshot")]
    [EndpointDescription("One screenshot on a message in one of the signed-in user's tickets.")]
    [ProducesResponseType<ScreenshotResponse>(StatusCodes.Status200OK, Description = "The screenshot.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The user has no such screenshot on this ticket.")]
    private static async Task<Results<Ok<ScreenshotResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        Guid screenshotId,
        [FromServices] GetScreenshotHandler handler,
        CancellationToken cancellationToken)
    {
        Result<ScreenshotResponse> result = await handler.HandleAsync(id, screenshotId, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
