using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.SendUserPasswordReset;

internal static class SendUserPasswordResetEndpoint
{
    internal const string Name = "SendUserPasswordReset";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost(UserRoutes.AdminUserPasswordReset, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.AdminTag);
    }

    [EndpointSummary("Send a user a reset link")]
    [EndpointDescription("Emails the user a link to set a new password, like Forgot password does. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The email is on its way.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no user with this ID. Admins aren't users here.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] SendUserPasswordResetHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
