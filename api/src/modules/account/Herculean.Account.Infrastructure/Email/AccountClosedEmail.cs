using System.Net;

using Herculean.Account.Application.Email;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class AccountClosedEmail
{
    private const string Subject = "Your Herculean account was closed";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("AccountClosedEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email, DateTimeOffset deleteAtUtc, string timeZone)
    {
        string deleteOn = LocalDates.FormatDate(deleteAtUtc, timeZone);
        BodyBuilder body = new()
        {
            TextBody = $"""
                Closed: {email}

                We closed your account because it broke our terms. Everything in it will be deleted on {deleteOn}.

                Questions: hello@minimalist.hr.
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
