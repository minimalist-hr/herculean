using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.EmailChanges.GetPendingEmailChange;

internal static class GetPendingEmailChangeEndpoint
{
    internal const string Name = "GetPendingEmailChange";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(EmailChangeRoutes.Pending, HandleAsync)
            .WithName(Name)
            .WithTags(EmailChangeRoutes.Tag);
    }

    [EndpointSummary("Get the email change that is waiting")]
    [EndpointDescription("The new address whose link hasn't been opened and hasn't expired.")]
    [ProducesResponseType<PendingEmailChangeResponse>(StatusCodes.Status200OK, Description = "The address waiting, or null.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    private static async Task<Results<Ok<PendingEmailChangeResponse>, ProblemHttpResult>> HandleAsync(
        [FromServices] GetPendingEmailChangeHandler handler,
        CancellationToken cancellationToken)
    {
        Result<PendingEmailChangeResponse> result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
