using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Blocks.UnblockFeedback;

internal static class UnblockFeedbackEndpoint
{
    internal const string Name = "UnblockFeedback";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(BlockRoutes.User, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(BlockRoutes.Tag);
    }

    [EndpointSummary("Unblock a user's feedback")]
    [EndpointDescription("Lets a user send feedback and reply again. Unblocking someone who isn't blocked changes nothing. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "They can send feedback.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] UnblockFeedbackHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
