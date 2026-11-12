using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Blocks.GetFeedbackBlock;

internal static class GetFeedbackBlockEndpoint
{
    internal const string Name = "GetFeedbackBlock";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(BlockRoutes.User, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(BlockRoutes.Tag);
    }

    [EndpointSummary("Get whether a user is blocked")]
    [EndpointDescription("Whether a user is blocked from sending feedback. Admins only.")]
    [ProducesResponseType<FeedbackBlockResponse>(StatusCodes.Status200OK, Description = "Whether they are blocked.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<Ok<FeedbackBlockResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] GetFeedbackBlockHandler handler,
        CancellationToken cancellationToken)
    {
        Result<FeedbackBlockResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
