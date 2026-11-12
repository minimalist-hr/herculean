using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Announcements.GetAnnouncement;

internal static class GetAdminAnnouncementEndpoint
{
    internal const string Name = "GetAdminAnnouncement";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(AnnouncementRoutes.Admin, HandleAsync)
            .RequireAdmin()
            .WithName(Name)
            .WithTags(AnnouncementRoutes.Tag);
    }

    [EndpointSummary("Get the announcement to edit")]
    [EndpointDescription("The announcement on Home, or null when there is none. Admins only.")]
    [ProducesResponseType<CurrentAnnouncementResponse>(StatusCodes.Status200OK, Description = "The announcement, or null.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden, "application/problem+json", Description = "The account isn't an admin.")]
    private static async Task<Ok<CurrentAnnouncementResponse>> HandleAsync(
        [FromServices] GetAnnouncementHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
