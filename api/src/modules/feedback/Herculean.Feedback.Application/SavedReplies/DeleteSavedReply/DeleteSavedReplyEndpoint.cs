using Herculean.Feedback.Application.Inbox;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.SavedReplies.DeleteSavedReply;

internal static class DeleteSavedReplyEndpoint
{
    internal const string Name = "DeleteSavedReply";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(InboxRoutes.SavedReply, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.SavedRepliesTag);
    }

    [EndpointSummary("Delete a saved reply")]
    [EndpointDescription("Deletes a saved reply for good. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The saved reply is gone.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no saved reply with this ID.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] DeleteSavedReplyHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
