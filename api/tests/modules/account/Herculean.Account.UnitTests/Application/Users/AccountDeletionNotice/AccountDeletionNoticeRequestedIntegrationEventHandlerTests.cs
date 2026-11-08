using Herculean.Account.Application.Users.AccountDeletionNotice;
using Herculean.Account.Contracts;

namespace Herculean.Account.UnitTests.Application.Users.AccountDeletionNotice;

public sealed class AccountDeletionNoticeRequestedIntegrationEventHandlerTests
{
    [Fact]
    public async Task EmailsTheAddressTheAccountUsed()
    {
        DateTimeOffset deletedAt = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);
        FakeEmailSender emailSender = new();
        AccountDeletionNoticeRequestedIntegrationEventHandler handler = new(emailSender);

        await handler.HandleAsync(new AccountDeletionNoticeRequestedIntegrationEvent("filip@example.com", deletedAt, "Europe/Zagreb"), TestContext.Current.CancellationToken);

        emailSender.AccountDeletedEmails.ShouldBe([new SentPasswordChangedEmail("filip@example.com", deletedAt, "Europe/Zagreb")]);
    }
}
