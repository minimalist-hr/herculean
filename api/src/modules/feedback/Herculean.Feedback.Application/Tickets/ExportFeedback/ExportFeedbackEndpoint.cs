using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.ExportFeedback;

internal static class ExportFeedbackEndpoint
{
    internal const string Name = "ExportFeedback";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(TicketRoutes.Export, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("Export the signed-in user's feedback")]
    [EndpointDescription("Every ticket the user sent, with its messages and screenshots, for the data export in Profile.")]
    [ProducesResponseType<FeedbackExportResponse>(StatusCodes.Status200OK, Description = "The feedback, which can be none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<FeedbackExportResponse>> HandleAsync(
        [FromServices] ExportFeedbackHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
