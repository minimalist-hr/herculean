using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Inbox.GetFeedbackStats;

internal static class GetFeedbackStatsEndpoint
{
    internal const string Name = "GetFeedbackStats";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(InboxRoutes.Stats, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.Tag);
    }

    [EndpointSummary("Count the feedback waiting")]
    [EndpointDescription("How many tickets wait for Minimalist's reply. Admins only.")]
    [ProducesResponseType<FeedbackStatsResponse>(StatusCodes.Status200OK, Description = "The count.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Ok<FeedbackStatsResponse>> HandleAsync(
        [FromServices] GetFeedbackStatsHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
