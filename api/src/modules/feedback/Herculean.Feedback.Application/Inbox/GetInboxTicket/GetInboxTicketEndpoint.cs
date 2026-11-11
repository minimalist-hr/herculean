using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Inbox.GetInboxTicket;

internal static class GetInboxTicketEndpoint
{
    internal const string Name = "GetInboxTicket";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(InboxRoutes.Ticket, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.Tag);
    }

    [EndpointSummary("Get a ticket in the inbox")]
    [EndpointDescription("Any user's ticket, with who sent it, the device and every message. Admins only.")]
    [ProducesResponseType<InboxTicketResponse>(StatusCodes.Status200OK, Description = "The ticket.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no ticket with this ID.")]
    private static async Task<Results<Ok<InboxTicketResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] GetInboxTicketHandler handler,
        CancellationToken cancellationToken)
    {
        Result<InboxTicketResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
