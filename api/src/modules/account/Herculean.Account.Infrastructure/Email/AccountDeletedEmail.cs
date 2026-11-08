using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class AccountDeletedEmail
{
    private const string Subject = "Your Herculean account was deleted";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("AccountDeletedEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email, DateTimeOffset deletedAtUtc, string timeZone)
    {
        string deletedAt = EmailResources.FormatTime(deletedAtUtc, timeZone);
        BodyBuilder body = new()
        {
            TextBody = $"""
                Account deleted for {email}

                Deleted on {deletedAt}. Your profile and every workout, routine, exercise and group were removed for good.

                Wasn't you? Write to hello@minimalist.hr.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(email), StringComparison.Ordinal)
                .Replace("{{DeletedAt}}", WebUtility.HtmlEncode(deletedAt), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }
}
