using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.UpdateCurrentUser;

internal static class UpdateCurrentUserEndpoint
{
    internal const string Name = "UpdateCurrentUser";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPatch(UserRoutes.Me, HandleAsync)
            .WithName(Name)
            .WithTags(UserRoutes.Tag);
    }

    [EndpointSummary("Change the signed-in user")]
    [EndpointDescription("Changes the name, units, theme, color or time zone. Setup sends the name and units, Profile the others; the app sends a new time zone when the phone's changes.")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK, Description = "The user after the change.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each field.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    private static async Task<Results<Ok<UserResponse>, ProblemHttpResult>> HandleAsync(
        [FromBody] UpdateCurrentUserRequest request,
        [FromServices] UpdateCurrentUserHandler handler,
        CancellationToken cancellationToken)
    {
        Result<UserResponse> result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
