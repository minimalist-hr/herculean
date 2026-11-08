using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.Users.DeleteCurrentUserPhoto;

internal static class DeleteCurrentUserPhotoEndpoint
{
    internal const string Name = "DeleteCurrentUserPhoto";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(UserRoutes.Photo, HandleAsync)
            .WithName(Name)
            .WithTags(UserRoutes.Tag);
    }

    [EndpointSummary("Remove the signed-in user's photo")]
    [EndpointDescription("Removes the profile photo. With no photo, it changes nothing.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "There is no photo now.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound, "application/problem+json", Description = "The account no longer exists.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromServices] DeleteCurrentUserPhotoHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
