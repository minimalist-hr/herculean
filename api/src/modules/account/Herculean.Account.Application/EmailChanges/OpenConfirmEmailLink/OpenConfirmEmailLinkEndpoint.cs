using System.ComponentModel;
using System.Net.Mime;

using Herculean.Account.Application.PasswordResets.OpenResetLink;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Herculean.Account.Application.EmailChanges.OpenConfirmEmailLink;

internal static class OpenConfirmEmailLinkEndpoint
{
    internal const string Name = "OpenConfirmEmailLink";

    internal static void Map(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(EmailChangeRoutes.ConfirmLink, Handle)
            .WithName(Name)
            .WithTags(EmailChangeRoutes.Tag)
            .AllowAnonymous();
    }

    // Opening it changes nothing, because email apps open links to check them. The app confirms the token.
    [EndpointSummary("Open an email change link")]
    [EndpointDescription("The page the email links to. It opens the app's screen that confirms the new email.")]
    [ProducesResponseType<string>(StatusCodes.Status200OK, MediaTypeNames.Text.Html, Description = "A page that opens the app.")]
    private static ContentHttpResult Handle(
        [FromQuery, Description("The token from the email.")] string? token,
        [FromServices] IEmailChangeLinks links,
        HttpResponse response)
    {
        // The page holds the token, so no cache keeps it.
        response.Headers.CacheControl = "no-store";

        return TypedResults.Text(ResetLinkPage.Render(links.Confirm(token ?? string.Empty), "Change email"), MediaTypeNames.Text.Html);
    }
}
