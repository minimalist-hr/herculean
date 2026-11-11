using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.GetUnreadFeedback;

internal static class GetUnreadFeedbackEndpoint
{
    internal const string Name = "GetUnreadFeedback";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(TicketRoutes.Unread, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("Count the signed-in user's unread feedback")]
    [EndpointDescription("How many of the user's tickets have a reply they haven't opened.")]
    [ProducesResponseType<UnreadFeedbackResponse>(StatusCodes.Status200OK, Description = "The count, which can be 0.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<UnreadFeedbackResponse>> HandleAsync(
        [FromServices] GetUnreadFeedbackHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
