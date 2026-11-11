using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.GetTicket;

internal static class GetTicketEndpoint
{
    internal const string Name = "GetTicket";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(TicketRoutes.Ticket, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("Get a ticket")]
    [EndpointDescription("One of the signed-in user's tickets, with every message. Opening it doesn't mark it read.")]
    [ProducesResponseType<TicketResponse>(StatusCodes.Status200OK, Description = "The ticket.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The user has no ticket with this ID.")]
    private static async Task<Results<Ok<TicketResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] GetTicketHandler handler,
        CancellationToken cancellationToken)
    {
        Result<TicketResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
