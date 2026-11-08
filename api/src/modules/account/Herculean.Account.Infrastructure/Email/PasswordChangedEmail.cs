using System.Globalization;
using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class PasswordChangedEmail
{
    private const string Subject = "Your Herculean password was changed";

    private static readonly string HtmlTemplate = EmailResources.ReadTemplate("PasswordChangedEmail.html");

    public static MimeMessage Create(MailboxAddress from, string email, DateTimeOffset changedAtUtc, string timeZone)
    {
        string changedAt = FormatChangedAt(changedAtUtc, timeZone);
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

    private static string FormatChangedAt(DateTimeOffset changedAtUtc, string timeZone)
    {
        DateTimeOffset local = TimeZoneInfo.ConvertTime(changedAtUtc, TimeZoneInfo.FindSystemTimeZoneById(timeZone));
        string weekday = local.ToString("ddd", CultureInfo.InvariantCulture);
        string monthAndTime = local.ToString("MMM yyyy 'at' HH:mm", CultureInfo.InvariantCulture);

        return $"{weekday}, {local.Day}{OrdinalSuffix(local.Day)} {monthAndTime} ({timeZone})";
    }

    private static string OrdinalSuffix(int day) =>
        (day % 10, day % 100) switch
        {
            (_, 11 or 12 or 13) => "th",
            (1, _) => "st",
            (2, _) => "nd",
            (3, _) => "rd",
            _ => "th",
        };
}
