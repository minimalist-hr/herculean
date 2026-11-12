using Herculean.SharedKernel.Auth;
using Herculean.SharedKernel.Results;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Announcements.SaveAnnouncement;

internal static class SaveAnnouncementEndpoint
{
    internal const string Name = "SaveAnnouncement";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPut(AnnouncementRoutes.Admin, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(AnnouncementRoutes.Tag);
    }

    [EndpointSummary("Put an announcement on Home")]
    [EndpointDescription("Shows an announcement on everyone's Home, replacing the last. It shows again on phones that closed the last. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "It's on Home.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json", Description = "A field is not valid. The errors name each one.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Results<NoContent, ProblemHttpResult>> HandleAsync(
        [FromBody] SaveAnnouncementRequest request,
        [FromServices] SaveAnnouncementHandler handler,
        CancellationToken cancellationToken)
    {
        Result result = await handler.HandleAsync(request, cancellationToken);

        return result.IsSuccess ? TypedResults.NoContent() : result.Error.ToProblem();
    }
}
