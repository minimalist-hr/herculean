using System.ComponentModel;
using System.Net.Mime;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.PasswordResets.OpenResetLink;

internal static class OpenResetLinkEndpoint
{
    internal const string Name = "OpenResetLink";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(PasswordResetRoutes.ResetLink, HandleAsync)
            .WithName(Name)
            .WithTags(PasswordResetRoutes.Tag)
            .AllowAnonymous();
    }

    [EndpointSummary("Open a password reset link")]
    [EndpointDescription("The page the email links to. It opens the app's new password screen, or its reset password screen when the link is unknown, used or expired.")]
    [ProducesResponseType<string>(StatusCodes.Status200OK, MediaTypeNames.Text.Html, Description = "A page that opens the app.")]
    private static async Task<ContentHttpResult> HandleAsync(
        [FromQuery, Description("The token from the email.")] string? token,
        [FromServices] OpenResetLinkHandler handler,
        HttpResponse response,
        CancellationToken cancellationToken)
    {
        string appLink = await handler.HandleAsync(token, cancellationToken);

        // The page holds the token, so no cache keeps it.
        response.Headers.CacheControl = "no-store";

        return TypedResults.Text(ResetLinkPage.Render(appLink), MediaTypeNames.Text.Html);
    }
}
