using Herculean.Account.Infrastructure.Email;

using MimeKit;

namespace Herculean.Account.UnitTests.Infrastructure.Email;

public sealed class PasswordChangedEmailTests
{
    private static MimeMessage Create(string email, DateTimeOffset? changedAtUtc = null) =>
        PasswordChangedEmail.Create(
            new MailboxAddress("Herculean", "no-reply@minimalist.hr"),
            email,
            changedAtUtc ?? new DateTimeOffset(2026, 11, 8, 12, 0, 0, TimeSpan.Zero),
            "Europe/Zagreb");

    [Theory]
    [InlineData(1, "Sun, 1st Nov")]
    [InlineData(2, "Mon, 2nd Nov")]
    [InlineData(3, "Tue, 3rd Nov")]
    [InlineData(4, "Wed, 4th Nov")]
    [InlineData(11, "Wed, 11th Nov")]
    [InlineData(12, "Thu, 12th Nov")]
    [InlineData(13, "Fri, 13th Nov")]
    [InlineData(21, "Sat, 21st Nov")]
    [InlineData(22, "Sun, 22nd Nov")]
    [InlineData(23, "Mon, 23rd Nov")]
    public void SaysWhenInTheUsersTimeZone(int day, string date)
    {
        using MimeMessage message = Create("filip@example.com", new DateTimeOffset(2026, 11, day, 12, 0, 0, TimeSpan.Zero));

        string changedAt = $"Changed on {date} 2026 at 13:00 (Europe/Zagreb).";
        message.TextBody!.ShouldContain(changedAt);
        message.HtmlBody!.ShouldContain(changedAt);
    }

    [Fact]
    public void ShowsTheDayItIsThereNotInUtc()
    {
        using MimeMessage message = Create("filip@example.com", new DateTimeOffset(2026, 11, 8, 23, 30, 0, TimeSpan.Zero));

        message.TextBody!.ShouldContain("Mon, 9th Nov 2026 at 00:30");
    }

    [Fact]
    public void GoesToTheEmailWithASubject()
    {
        using MimeMessage message = Create("filip@example.com");

        message.To.ToString().ShouldBe("filip@example.com");
        message.Subject.ShouldBe("Your Herculean password was changed");
    }

    [Fact]
    public void SaysWhatHappenedInHtmlAndPlainText()
    {
        using MimeMessage message = Create("filip@example.com");

        message.HtmlBody!.ShouldContain("Password changed for filip@example.com");
        message.HtmlBody!.ShouldContain("Forgot password");
        message.HtmlBody!.ShouldNotContain("{{");
        message.TextBody!.ShouldContain("Password changed for filip@example.com");
        message.TextBody!.ShouldContain("Forgot password");
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
        message.BodyParts.OfType<MimePart>().ShouldContain(part => part.ContentId == "wordmark");
    }
}
