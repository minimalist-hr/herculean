using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.GetCurrentUserPhoto;

internal static class GetCurrentUserPhotoEndpoint
{
    internal const string Name = "GetCurrentUserPhoto";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(UserRoutes.Photo, HandleAsync)
            .WithName(Name)
            .WithTags(UserRoutes.Tag);
    }

    [EndpointSummary("Get the signed-in user's photo")]
    [EndpointDescription("The profile photo, or null when there is none.")]
    [ProducesResponseType<UserPhotoResponse>(StatusCodes.Status200OK, Description = "The photo, or null.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    private static async Task<Results<Ok<UserPhotoResponse>, ProblemHttpResult>> HandleAsync(
        [FromServices] GetCurrentUserPhotoHandler handler,
        CancellationToken cancellationToken)
    {
        Result<UserPhotoResponse> result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.Ok(result.Value) : result.Error.ToProblem();
    }
}
