using Herculean.Account.Application.Users.GetCurrentUserPhoto;
using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.GetUserPhoto;

internal static class GetUserPhotoEndpoint
{
    internal const string Name = "GetUserPhoto";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(UserRoutes.AdminUserPhoto, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(UserRoutes.AdminTag);
    }

    [EndpointSummary("Get a user's photo")]
    [EndpointDescription("A user's profile photo, or null when there is none. Admins only.")]
    [ProducesResponseType<UserPhotoResponse>(StatusCodes.Status200OK, Description = "The photo, or null.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "There is no user with this ID. Admins aren't users here.")]
    private static async Task<Results<Ok<UserPhotoResponse>, ProblemHttpResult>> HandleAsync(
        Guid id,
        [FromServices] GetUserPhotoHandler handler,
        CancellationToken cancellationToken)
    {
        Result<UserPhotoResponse> result = await handler.HandleAsync(id, cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
