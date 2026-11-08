using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class AccountDeletedEmailTests
{
    private static MimeMessage Create(string email) =>
        AccountDeletedEmail.Create(new MailboxAddress("Herculean", "no-reply@minimalist.hr"), email, new DateTimeOffset(2026, 11, 8, 12, 0, 0, TimeSpan.Zero), "Europe/Zagreb");

    [Fact]
    public void SaysWhenInHtmlAndPlainText()
    {
        using MimeMessage message = Create("filip@example.com");

        message.To.ToString().ShouldBe("filip@example.com");
        message.Subject.ShouldBe("Your Herculean account was deleted");
        message.HtmlBody!.ShouldContain("Deleted on Sun, 8th Nov 2026 at 13:00 (Europe/Zagreb).");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain("Deleted on Sun, 8th Nov 2026 at 13:00 (Europe/Zagreb).");
        message.TextBody!.ShouldContain("hello@minimalist.hr");
    }

    [Fact]
    public void EncodesTheAddressAndCarriesTheLogo()
    {
        using MimeMessage message = Create("o'neil&co@example.com");

        message.HtmlBody!.ShouldContain("o&#39;neil&amp;co@example.com");
        message.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
    }
}
