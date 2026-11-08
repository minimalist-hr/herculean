using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class PasswordChangedEmail
{
    private const string Subject = "Your Herculean password was changed";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("PasswordChangedEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email, DateTimeOffset changedAtUtc, string timeZone)
    {
        string changedAt = EmailResources.FormatTime(changedAtUtc, timeZone);
        BodyBuilder body = new()
        {
            TextBody = $"""
                Password changed for {email}

                Changed on {changedAt}. The device that made the change stays signed in. Every other device was signed out.

                Wasn't you? Open Herculean, tap Forgot password on the sign in screen, and set a new one.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(email), StringComparison.Ordinal)
                .Replace("{{ChangedAt}}", WebUtility.HtmlEncode(changedAt), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }
}
