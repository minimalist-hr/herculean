using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Inbox.AddTicketNote;

internal static class AddTicketNoteEndpoint
{
    internal const string Name = "AddTicketNote";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(InboxRoutes.Notes, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.Tag);
    }

    [EndpointSummary("Add a note to a ticket")]
    [EndpointDescription("Adds a note to any user's ticket. Only admins see notes, and they go with the ticket. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The note is saved.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no ticket with this ID.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromBody] AddTicketNoteRequest request,
        [FromServices] AddTicketNoteHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
