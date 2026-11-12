using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Announcements.RemoveAnnouncement;

internal static class RemoveAnnouncementEndpoint
{
    internal const string Name = "RemoveAnnouncement";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapDelete(AnnouncementRoutes.Admin, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(AnnouncementRoutes.Tag);
    }

    [EndpointSummary("Remove the announcement")]
    [EndpointDescription("Takes the announcement off everyone's Home. Removing when there is none changes nothing. Admins only.")]
    [ProducesResponseType(StatusCodes.Status204NoContent, Description = "There is no announcement.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<NoContent> HandleAsync(
        [FromServices] RemoveAnnouncementHandler handler,
        CancellationToken cancellationToken)
    {
        await handler.HandleAsync(cancellationToken);

        return TypedResults.NoContent();
    }
}
