using System.Net;

using Herculean.Account.Application.Email;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class PasswordChangedEmail
{
    private const string Subject = "Your Herculean password was changed";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("PasswordChangedEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email, DateTimeOffset changedAtUtc, string timeZone, bool withResetLink)
    {
        string changedAt = LocalDates.FormatTime(changedAtUtc, timeZone);
        // A reset signs out every device. A change keeps the device that made it.
        string changed = withResetLink
            ? $"Changed with a reset link on {changedAt}. Every device was signed out."
            : $"Changed on {changedAt}. The device that made the change stays signed in. Every other device was signed out.";
        BodyBuilder body = new()
        {
            TextBody = $"""
                Password changed for {email}

                {changed}

                Wasn't you? Open Herculean, tap Forgot password on the sign in screen, and set a new one.
                """,
            HtmlBody = HtmlTemplate
                .Replace("{{Email}}", WebUtility.HtmlEncode(email), StringComparison.Ordinal)
                .Replace("{{Changed}}", WebUtility.HtmlEncode(changed), StringComparison.Ordinal)
                .Replace("{{LogoSource}}", EmailResources.LogoSource, StringComparison.Ordinal),
        };
        EmailResources.AddLogo(body);

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }
}
