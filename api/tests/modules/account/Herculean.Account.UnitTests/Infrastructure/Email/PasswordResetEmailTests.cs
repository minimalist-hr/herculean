using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class PasswordResetEmailTests
{
    private const string Link = "https://api.example.com/links/reset-password?token=a&b";

    private static MimeMessage Create(string email) =>
        PasswordResetEmail.Create(new MailboxAddress("Herculean", "no-reply@minimalist.hr"), email, Link);

    [Fact]
    public void GoesFromHerculeanToTheEmailWithASubject()
    {
        using MimeMessage message = Create("filip@example.com");

        message.From.ToString().ShouldContain("no-reply@minimalist.hr");
        message.To.ToString().ShouldBe("filip@example.com");
        message.Subject.ShouldBe("Reset your Herculean password");
    }

    [Fact]
    public void HasTheLinkAndTheEmailInHtmlAndPlainText()
    {
        using MimeMessage message = Create("filip@example.com");

        message.HtmlBody!.ShouldContain("Reset link for filip@example.com");
        message.HtmlBody!.ShouldContain("href=\"https://api.example.com/links/reset-password?token=a&amp;b\"");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain("Reset link for filip@example.com");
        message.TextBody!.ShouldContain(Link);
    }

    [Fact]
    public void HtmlEncodesTheEmail()
    {
        using MimeMessage message = Create("o'neil&co@example.com");

        message.HtmlBody!.ShouldContain("o&#39;neil&amp;co@example.com");
    }

    [Fact]
    public void CarriesTheLogoInTheEmail()
    {
        using MimeMessage message = Create("filip@example.com");

        message.HtmlBody!.ShouldContain("src=\"cid:wordmark\"");
        MimePart logo = message.BodyParts.OfType<MimePart>().Single(part => part.ContentId == "wordmark");
        logo.ContentType.MimeType.ShouldBe("image/png");
    }
}
