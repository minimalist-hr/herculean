using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class AccountClosedEmailTests
{
    [Fact]
    public void SaysWhyAndWhenEverythingGoes()
    {
        using MimeMessage message = AccountClosedEmail.Create(
            new MailboxAddress("Herculean", "no-reply@minimalist.hr"), "o'neil@example.com", new DateTimeOffset(2026, 11, 25, 12, 0, 0, TimeSpan.Zero), "Europe/Zagreb");

        message.To.ToString().ShouldBe("o'neil@example.com");
        message.Subject.ShouldBe("Your Herculean account was closed");
        message.HtmlBody!.ShouldContain("We closed your account because it broke our terms. Everything in it will be deleted on Wed, 25th Nov 2026.");
        message.HtmlBody!.ShouldContain("o&#39;neil@example.com");
        message.HtmlBody!.ShouldContain("hello@minimalist.hr");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain("Questions: hello@minimalist.hr.");
        message.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
    }
}
