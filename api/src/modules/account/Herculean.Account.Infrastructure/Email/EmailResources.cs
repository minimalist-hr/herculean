using System.Globalization;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

/// <summary>What every email is built from: its HTML template and the logo it carries.</summary>
internal static class EmailResources
{
    private const string LogoContentId = "wordmark";
    private const string ResourcePrefix = "Herculean.Account.Infrastructure.Email.";

    public const string LogoSource = $"cid:{LogoContentId}";

    public static string ReadTemplate(string name)
    {
        using StreamReader reader = new(Open(name));

        return reader.ReadToEnd();
    }

    public static void AddLogo(BodyBuilder body)
    {
        using Stream logo = Open("wordmark-on-dark.png");
        body.LinkedResources.Add("wordmark.png", logo, new ContentType("image", "png")).ContentId = LogoContentId;
    }

    /// <summary>For example "Sun, 8th Nov 2026 at 14:05 (Europe/Zagreb)", in the user's own time zone.</summary>
    public static string FormatTime(DateTimeOffset timeUtc, string timeZone)
    {
        DateTimeOffset local = TimeZoneInfo.ConvertTime(timeUtc, TimeZoneInfo.FindSystemTimeZoneById(timeZone));
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

    private static Stream Open(string name) =>
        typeof(EmailResources).Assembly.GetManifestResourceStream(ResourcePrefix + name)
        ?? throw new InvalidOperationException($"The resource {name} is missing.");
}
