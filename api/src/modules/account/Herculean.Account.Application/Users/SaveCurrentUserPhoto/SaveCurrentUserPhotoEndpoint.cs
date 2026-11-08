using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.SaveCurrentUserPhoto;

internal static class SaveCurrentUserPhotoEndpoint
{
    internal const string Name = "SaveCurrentUserPhoto";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(UserRoutes.Photo, HandleAsync)
            .WithName(Name)
            .WithTags(UserRoutes.Tag);
    }

    [EndpointSummary("Save the signed-in user's photo")]
    [EndpointDescription("Sets or replaces the profile photo.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "The photo is saved.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "It isn't a Base64 JPEG, or it is over 1 MB.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] SaveCurrentUserPhotoRequest request,
        [FromServices] SaveCurrentUserPhotoHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
