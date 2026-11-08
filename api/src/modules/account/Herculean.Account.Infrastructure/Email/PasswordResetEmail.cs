using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class PasswordResetEmail
{
    private const string Subject = "Reset your Herculean password";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("PasswordResetEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email, string link)
    {
        BodyBuilder body = new()
        {
            TextBody = $"""
                Reset link for {email}

                Open it on the phone with Herculean to set a new password. It works for one hour.

                {link}

                Didn't ask for this? Ignore this email. Your password stays the same.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(email), StringComparison.Ordinal)
                .Replace("{{Link}}", WebUtility.HtmlEncode(link), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }
}
