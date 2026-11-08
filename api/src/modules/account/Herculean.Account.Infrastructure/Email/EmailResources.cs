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

    private static Stream Open(string name) =>
        typeof(EmailResources).Assembly.GetManifestResourceStream(ResourcePrefix + name)
        ?? throw new InvalidOperationException($"The resource {name} is missing.");
}
