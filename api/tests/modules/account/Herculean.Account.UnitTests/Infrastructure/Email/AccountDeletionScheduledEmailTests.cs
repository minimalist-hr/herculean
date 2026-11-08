using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class AccountDeletionScheduledEmailTests
{
    private static MimeMessage Create(string email) =>
        AccountDeletionScheduledEmail.Create(new MailboxAddress("Herculean", "no-reply@minimalist.hr"), email, new DateTimeOffset(2026, 11, 22, 12, 0, 0, TimeSpan.Zero), "Europe/Zagreb");

    [Fact]
    public void SaysTheDayAndHowToKeepTheAccount()
    {
        using MimeMessage message = Create("filip@example.com");

        message.To.ToString().ShouldBe("filip@example.com");
        message.Subject.ShouldBe("Your Herculean account will be deleted");
        message.HtmlBody!.ShouldContain("Your account will be deleted on Sun, 22nd Nov 2026.");
        message.HtmlBody!.ShouldContain("Sign in before then to keep your account.");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain("Your account will be deleted on Sun, 22nd Nov 2026.");
    }

    [Fact]
    public void EncodesTheAddressAndCarriesTheLogo()
    {
        using MimeMessage message = Create("o'neil&co@example.com");

        message.HtmlBody!.ShouldContain("o&#39;neil&amp;co@example.com");
        message.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
    }
}
