using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.ListTickets;

internal static class ListTicketsEndpoint
{
    internal const string Name = "ListTickets";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(TicketRoutes.Tickets, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("List the signed-in user's feedback")]
    [EndpointDescription("Every ticket the user sent, the one with the latest message first.")]
    [ProducesResponseType<List<TicketListItemResponse>>(StatusCodes.Status200OK, Description = "The tickets, which can be none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<List<TicketListItemResponse>>> HandleAsync(
        [FromServices] ListTicketsHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
