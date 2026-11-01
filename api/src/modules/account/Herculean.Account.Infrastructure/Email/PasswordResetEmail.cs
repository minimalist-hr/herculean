using System.Net;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal static class PasswordResetEmail
{
    private const string Subject = "Reset your Herculean password";
    private const string LogoContentId = "wordmark";
    private const string ResourcePrefix = "Herculean.Account.Infrastructure.Email.";

    private static readonly string HtmlTemplate = ReadHtmlTemplate();

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
                .Replace("{{LogoSource}}", $"cid:{LogoContentId}", StringComparison.Ordinal),
        };

        using Stream logo = OpenResource("wordmark-on-dark.png");
        body.LinkedResources.Add("wordmark.png", logo, new ContentType("image", "png")).ContentId = LogoContentId;

        return new MimeMessage([from], [MailboxAddress.Parse(email)], Subject, body.ToMessageBody());
    }

    private static string ReadHtmlTemplate()
    {
        using StreamReader reader = new(OpenResource("PasswordResetEmail.html"));

        return reader.ReadToEnd();
    }

    private static Stream OpenResource(string name) =>
        typeof(PasswordResetEmail).Assembly.GetManifestResourceStream(ResourcePrefix + name)
        ?? throw new InvalidOperationException($"The resource {name} is missing.");
}
