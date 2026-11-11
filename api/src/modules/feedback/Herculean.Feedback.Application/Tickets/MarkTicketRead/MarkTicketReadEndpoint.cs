using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Tickets.MarkTicketRead;

internal static class MarkTicketReadEndpoint
{
    internal const string Name = "MarkTicketRead";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(TicketRoutes.Read, HandleAsync)
            .WithName(Name)
            .WithTags(TicketRoutes.Tag);
    }

    [EndpointSummary("Mark a ticket read")]
    [EndpointDescription("Marks every reply on one of the signed-in user's tickets as read. Marking it again changes nothing.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The ticket is read.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The user has no ticket with this ID.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] MarkTicketReadHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
