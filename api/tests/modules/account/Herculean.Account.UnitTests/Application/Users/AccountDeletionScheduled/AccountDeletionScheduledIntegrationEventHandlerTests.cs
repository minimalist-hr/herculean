using Herculean.Account.Application.Users.AccountDeletionScheduled;
using Herculean.Account.Contracts;

namespace Herculean.Account.UnitTests.Application.Users.AccountDeletionScheduled;

public sealed class AccountDeletionScheduledIntegrationEventHandlerTests
{
    [Fact]
    public async Task EmailsWhenItHappens()
    {
        DateTimeOffset deleteAt = new(2026, 11, 22, 12, 0, 0, TimeSpan.Zero);
        FakeEmailSender emailSender = new();
        AccountDeletionScheduledIntegrationEventHandler handler = new(emailSender);

        await handler.HandleAsync(new AccountDeletionScheduledIntegrationEvent("filip@example.com", deleteAt, "Europe/Zagreb"), TestContext.Current.CancellationToken);

        emailSender.DeletionScheduledEmails.ShouldBe([new SentPasswordChangedEmail("filip@example.com", deleteAt, "Europe/Zagreb")]);
    }
}
