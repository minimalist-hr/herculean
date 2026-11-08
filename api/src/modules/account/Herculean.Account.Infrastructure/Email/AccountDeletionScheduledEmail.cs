using System.Net;

using Herculean.Account.Application.Email;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class AccountDeletionScheduledEmail
{
    private const string Subject = "Your Herculean account will be deleted";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("AccountDeletionScheduledEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email, DateTimeOffset deleteAtUtc, string timeZone)
    {
        string deleteOn = LocalDates.FormatDate(deleteAtUtc, timeZone);
        BodyBuilder body = new()
        {
            TextBody = $"""
                Deletion scheduled for {email}

                Your account will be deleted on {deleteOn}. Your profile and every workout, routine, exercise and group will then be removed for good.

                Sign in before then to keep your account.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(email), StringComparison.Ordinal)
                .Replace("{{DeleteOn}}", WebUtility.HtmlEncode(deleteOn), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }
}
