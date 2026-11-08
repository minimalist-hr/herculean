using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class EmailChangeEmailsTests
{
    private const string Link = "https://api.example.com/links/confirm-email?token=a&b";

    private static readonly MailboxAddress From = new("Herculean", "no-reply@minimalist.hr");

    [Fact]
    public void TheLinkGoesToTheNewAddressInHtmlAndPlainText()
    {
        using MimeMessage message = EmailChangeLinkEmail.Create(From, "new@example.com", Link);

        message.To.ToString().ShouldBe("new@example.com");
        message.Subject.ShouldBe("Confirm your new Herculean email");
        message.HtmlBody!.ShouldContain("Confirm new@example.com");
        message.HtmlBody!.ShouldContain("href=\"https://api.example.com/links/confirm-email?token=a&amp;b\"");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain(Link);
    }

    [Fact]
    public void TheNoticeGoesToTheOldAddressAndSaysWhen()
    {
        using MimeMessage message = EmailChangedEmail.Create(From, "old@example.com", new DateTimeOffset(2026, 11, 8, 12, 0, 0, TimeSpan.Zero), "Europe/Zagreb");

        message.To.ToString().ShouldBe("old@example.com");
        message.Subject.ShouldBe("Your Herculean email was changed");
        message.HtmlBody!.ShouldContain("Changed on Sun, 8th Nov 2026 at 13:00 (Europe/Zagreb).");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain("hello@minimalist.hr");
    }

    [Fact]
    public void BothEncodeTheAddressAndCarryTheLogo()
    {
        using MimeMessage link = EmailChangeLinkEmail.Create(From, "o'neil&co@example.com", Link);
        using MimeMessage notice = EmailChangedEmail.Create(From, "o'neil&co@example.com", DateTimeOffset.UnixEpoch, "Europe/Zagreb");

        link.HtmlBody!.ShouldContain("o&#39;neil&amp;co@example.com");
        notice.HtmlBody!.ShouldContain("o&#39;neil&amp;co@example.com");
        link.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
        notice.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
    }
}
