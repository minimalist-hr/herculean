using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class AccountKeptEmailTests
{
    [Fact]
    public void SaysTheAccountStaysAndTheyCanSignIn()
    {
        using MimeMessage message = AccountKeptEmail.Create(new MailboxAddress("Herculean", "no-reply@minimalist.hr"), "ana@example.com");

        const string kept = "Your account won’t be deleted. Everything in it stays, and you can sign in again.";
        message.To.ToString().ShouldBe("ana@example.com");
        message.Subject.ShouldBe("Your Herculean account will be kept");
        message.HtmlBody!.ShouldContain("Account kept for ana@example.com");
        message.HtmlBody!.ShouldContain(kept);
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain(kept);
        message.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
    }
}
