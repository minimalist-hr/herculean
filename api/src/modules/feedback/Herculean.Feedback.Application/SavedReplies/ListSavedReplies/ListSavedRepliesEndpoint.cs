using Herculean.Feedback.Application.Inbox;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.SavedReplies.ListSavedReplies;

internal static class ListSavedRepliesEndpoint
{
    internal const string Name = "ListSavedReplies";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(InboxRoutes.SavedReplies, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.SavedRepliesTag);
    }

    [EndpointSummary("List saved replies")]
    [EndpointDescription("Every saved reply, in the order they were made. Every admin shares them. Admins only.")]
    [ProducesResponseType<List<SavedReplyResponse>>(StatusCodes.Status200OK, Description = "The saved replies, which can be none.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<Ok<List<SavedReplyResponse>>, ProblemHttpResult>> HandleAsync(
        [FromServices] ListSavedRepliesHandler handler,
        CancellationToken cancellationToken)
    {
        Result<List<SavedReplyResponse>> result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
