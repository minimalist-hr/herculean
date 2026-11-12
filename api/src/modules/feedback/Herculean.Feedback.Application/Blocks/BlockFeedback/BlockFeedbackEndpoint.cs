using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Blocks.BlockFeedback;

internal static class BlockFeedbackEndpoint
{
    internal const string Name = "BlockFeedback";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(BlockRoutes.User, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(BlockRoutes.Tag);
    }

    [EndpointSummary("Block a user's feedback")]
    [EndpointDescription("Stops a user from sending feedback or replying. They can still read their tickets, and aren't told until they try. Blocking again changes nothing. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "They are blocked.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] BlockFeedbackHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
