using Herculean.SharedKernel.Auth;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Feedback.Application.Announcements.GetAnnouncement;

internal static class GetAnnouncementEndpoint
{
    internal const string Name = "GetAnnouncement";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(AnnouncementRoutes.Current, HandleAsync)
            .WithName(Name)
            .WithTags(AnnouncementRoutes.Tag);
    }

    [EndpointSummary("Get the announcement")]
    [EndpointDescription("Minimalist's announcement for Home, or null when there is none.")]
    [ProducesResponseType<CurrentAnnouncementResponse>(StatusCodes.Status200OK, Description = "The announcement, or null.")]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized, "application/problem+json", Description = "Not signed in, or the access token expired.")]
    private static async Task<Ok<CurrentAnnouncementResponse>> HandleAsync(
        [FromServices] GetAnnouncementHandler handler,
        CancellationToken cancellationToken)
    {
        return TypedResults.Ok(await handler.HandleAsync(cancellationToken));
    }
}
