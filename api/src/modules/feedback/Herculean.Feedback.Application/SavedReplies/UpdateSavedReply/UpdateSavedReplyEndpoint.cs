using Herculean.Feedback.Application.Inbox;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.SavedReplies.UpdateSavedReply;

internal static class UpdateSavedReplyEndpoint
{
    internal const string Name = "UpdateSavedReply";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(InboxRoutes.SavedReply, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.SavedRepliesTag);
    }

    [EndpointSummary("Change a saved reply")]
    [EndpointDescription("Changes a saved reply's title and text. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The saved reply is changed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no saved reply with this ID.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromBody] SaveSavedReplyRequest request,
        [FromServices] UpdateSavedReplyHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
