using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class EmailChangedEmail
{
    private const string Subject = "Your Herculean email was changed";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("EmailChangedEmail.html");

    public static MimeMessage Create(MailboxAddress from, string oldEmail, DateTimeOffset changedAtUtc, string timeZone)
    {
        string changedAt = EmailResources.FormatTime(changedAtUtc, timeZone);
        BodyBuilder body = new()
        {
            TextBody = $"""
                Email changed for {oldEmail}

                Changed on {changedAt}. This address no longer signs in to Herculean.

                Wasn't you? Write to hello@minimalist.hr.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(oldEmail), StringComparison.Ordinal)
                .Replace("{{ChangedAt}}", WebUtility.HtmlEncode(changedAt), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(oldEmail)], Subject, body.ToMessageBody());
    }
}
