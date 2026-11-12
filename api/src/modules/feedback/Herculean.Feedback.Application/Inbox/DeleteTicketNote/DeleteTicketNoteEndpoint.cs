using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Inbox.DeleteTicketNote;

internal static class DeleteTicketNoteEndpoint
{
    internal const string Name = "DeleteTicketNote";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(InboxRoutes.Note, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.Tag);
    }

    [EndpointSummary("Delete a note")]
    [EndpointDescription("Deletes a note on a ticket for good. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The note is gone.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no such note on this ticket.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        Guid noteId,
        [FromServices] DeleteTicketNoteHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, noteId, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
