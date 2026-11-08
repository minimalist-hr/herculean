using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.ChangePassword;

internal static class ChangePasswordEndpoint
{
    internal const string Name = "ChangePassword";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(UserRoutes.Password, HandleAsync)
            .WithName(Name)
            .WithTags(UserRoutes.Tag)
            .RequireRateLimiting(UserRoutes.ChangePasswordRateLimit);
    }

    [EndpointSummary("Change the password")]
    [EndpointDescription("Sets a new password after checking the current one. This device stays signed in and every other device is signed out.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The password is changed.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid, or the current password is wrong. The errors name each field.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests, "application/problem+json", Description = "Too many tries from this address. Wait a minute; Retry-After says how long.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] ChangePasswordRequest request,
        [FromServices] ChangePasswordHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
