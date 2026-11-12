using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class ProfilePhotoRemovedEmail
{
    private const string Subject = "Your profile photo was removed";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("ProfilePhotoRemovedEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email)
    {
        BodyBuilder body = new()
        {
            TextBody = $"""
                Photo removed from {email}

                We removed your profile photo because it broke our terms.

                You can add another in Profile.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(email), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }
}
