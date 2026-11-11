using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.CreateTicket;

internal static class CreateTicketEndpoint
{
    internal const string Name = "CreateTicket";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(TicketRoutes.Tickets, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("Send feedback")]
    [EndpointDescription("Creates a ticket with its first message, screenshots and the device it was sent from. A user can send 10 tickets a day.")]
    [ProducesResponseType<TicketCreatedResponse>(StatusCodes.Status201Created, Description = "The new ticket.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The user has sent 10 tickets in the last day.")]
    private static async Task<Results<Created<TicketCreatedResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] CreateTicketRequest request,
        [FromServices] CreateTicketHandler handler,
        CancellationToken cancellationToken)
    {
        Result<TicketCreatedResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess
            ? TypedResults.Created($"{TicketRoutes.Tickets}/{result.Value.Id}", result.Value)
            : result.Error.ToProblem();
    }
}
