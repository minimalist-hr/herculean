using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Inbox.ListInboxTickets;

internal static class ListInboxTicketsEndpoint
{
    internal const string Name = "ListInboxTickets";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(InboxRoutes.Tickets, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.Tag);
    }

    [EndpointSummary("List the feedback inbox")]
    [EndpointDescription("Every user's tickets, or those in one status or from one user: high priority first, then the one with the latest message first. Admins only.")]
    [ProducesResponseType<List<InboxTicketListItemResponse>>(StatusCodes.Status200OK, Description = "The tickets, which can be none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<Ok<List<InboxTicketListItemResponse>>, ProblemHttpResult>> HandleAsync(
        [AsParameters] ListInboxTicketsRequest request,
        [FromServices] ListInboxTicketsHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<InboxTicketListItemResponse>> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
