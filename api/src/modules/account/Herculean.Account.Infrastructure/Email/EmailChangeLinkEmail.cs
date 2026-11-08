using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class EmailChangeLinkEmail
{
    private const string Subject = "Confirm your new Herculean email";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("EmailChangeLinkEmail.html");

    public static MimeMessage Create(MailboxAddress from, string newEmail, string link)
    {
        BodyBuilder body = new()
        {
            TextBody = $"""
                Confirm {newEmail}

                Open the link on the phone with Herculean to sign in with this address from now on. It works for 24 hours.

                {link}

                Didn't ask for this? Ignore this email. Your email stays the same.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(newEmail), StringComparison.Ordinal)
                .Replace("{{Link}}", WebUtility.HtmlEncode(link), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(newEmail)], Subject, body.ToMessageBody());
    }
}
