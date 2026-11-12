using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Blocks.GetOwnFeedbackBlock;

internal static class GetOwnFeedbackBlockEndpoint
{
    internal const string Name = "GetOwnFeedbackBlock";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(BlockRoutes.Own, HandleAsync)
            .WithName(Name)
            .WithTags(BlockRoutes.Tag);
    }

    [EndpointSummary("Get whether you can send feedback")]
    [EndpointDescription("Whether the signed-in user is blocked from sending feedback or replying, so the app can say so first.")]
    [ProducesResponseType<FeedbackBlockResponse>(StatusCodes.Status200OK, Description = "Whether you are blocked.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Results<Ok<FeedbackBlockResponse>, ProblemHttpResult>> HandleAsync(
        [FromServices] GetOwnFeedbackBlockHandler handler,
        CancellationToken cancellationToken)
    {
        Result<FeedbackBlockResponse> result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
