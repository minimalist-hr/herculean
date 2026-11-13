using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class AccountKeptEmail
{
    private const string Subject = "Your Herculean account will be kept";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("AccountKeptEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email)
    {
        BodyBuilder body = new()
        {
            TextBody = $"""
                Account kept for {email}

                Your account won’t be deleted. Everything in it stays, and you can sign in again.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(email), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }
}
