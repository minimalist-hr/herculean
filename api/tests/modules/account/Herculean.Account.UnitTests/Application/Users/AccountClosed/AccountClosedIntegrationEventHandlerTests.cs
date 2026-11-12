using Herculean.Account.Application.Users.AccountClosed;
using Herculean.Account.Contracts;

namespace Herculean.Account.UnitTests.Application.Users.AccountClosed;

public sealed class AccountClosedIntegrationEventHandlerTests
{
    [Fact]
    public async Task TheEmailSaysWhenTheAccountGoes()
    {
        FakeEmailSender emailSender = new();
        DateTimeOffset deleteAt = new(2026, 11, 25, 12, 0, 0, TimeSpan.Zero);

        await new AccountClosedIntegrationEventHandler(emailSender).HandleAsync(
            new AccountClosedIntegrationEvent("ana@example.com", deleteAt, "Europe/Zagreb"), TestContext.Current.CancellationToken);

        emailSender.AccountClosedEmails.ShouldBe([new SentPasswordChangedEmail("ana@example.com", deleteAt, "Europe/Zagreb")]);
    }
}
