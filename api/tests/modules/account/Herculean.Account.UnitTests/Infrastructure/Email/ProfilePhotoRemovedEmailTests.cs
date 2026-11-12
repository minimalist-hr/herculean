using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class ProfilePhotoRemovedEmailTests
{
    [Fact]
    public void SaysWhyAndThatAnotherCanBeAdded()
    {
        using MimeMessage message = ProfilePhotoRemovedEmail.Create(new MailboxAddress("Herculean", "no-reply@minimalist.hr"), "ana@example.com");

        message.To.ToString().ShouldBe("ana@example.com");
        message.Subject.ShouldBe("Your profile photo was removed");
        message.HtmlBody!.ShouldContain("We removed your profile photo because it broke our terms.");
        message.HtmlBody!.ShouldContain("You can add another in Profile.");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain("We removed your profile photo because it broke our terms.");
        message.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
    }
}
