using Herculean.Feedback.Application.Inbox;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.SavedReplies.CreateSavedReply;

internal static class CreateSavedReplyEndpoint
{
    internal const string Name = "CreateSavedReply";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(InboxRoutes.SavedReplies, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(InboxRoutes.SavedRepliesTag);
    }

    [EndpointSummary("Create a saved reply")]
    [EndpointDescription("Saves an answer every admin can pick on a ticket. At most 50. Admins only.")]
    [ProducesResponseType<SavedReplyCreatedResponse>(StatusCodes.Status200OK, Description = "The saved reply's ID.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict, "application/problem+json", Description = "There are 50 saved replies already.")]
    private static async Task<Results<Ok<SavedReplyCreatedResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] SaveSavedReplyRequest request,
        [FromServices] CreateSavedReplyHandler handler,
        CancellationToken cancellationToken)
    {
        Result<SavedReplyCreatedResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
