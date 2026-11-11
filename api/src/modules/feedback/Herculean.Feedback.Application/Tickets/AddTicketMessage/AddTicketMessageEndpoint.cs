using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.AddTicketMessage;

internal static class AddTicketMessageEndpoint
{
    internal const string Name = "AddTicketMessage";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(TicketRoutes.Messages, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("Reply to a ticket")]
    [EndpointDescription("Adds the signed-in user's message to one of their tickets, which then waits for Minimalist again. A closed ticket takes no replies.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The reply is sent.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The user has no ticket with this ID.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "The ticket is closed.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromBody] AddTicketMessageRequest request,
        [FromServices] AddTicketMessageHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
