using Herculean.Account.Application.EmailChanges.EmailChanged;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.EmailChanges;

public sealed class EmailChangedIntegrationEventHandlerTests
{
    private static readonly DateTimeOffset ChangedAt = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeEmailSender _emailSender = new();
    private readonly EmailChangedIntegrationEventHandler _handler;

    public EmailChangedIntegrationEventHandlerTests()
    {
        _handler = new EmailChangedIntegrationEventHandler(_userRepository, _emailSender);
    }

    [Fact]
    public async Task TellsTheOldAddress()
    {
        User user = User.Create("new@example.com", "hash", "Europe/Zagreb");
        _userRepository.Add(user);

        await _handler.HandleAsync(new EmailChangedIntegrationEvent(user.Id.Value, "old@example.com", ChangedAt), TestContext.Current.CancellationToken);

        _emailSender.EmailChangedEmails.ShouldBe([new SentPasswordChangedEmail("old@example.com", ChangedAt, "Europe/Zagreb")]);
    }

    [Fact]
    public async Task SendsNothingOnceTheAccountIsGone()
    {
        await _handler.HandleAsync(new EmailChangedIntegrationEvent(Guid.CreateVersion7(), "old@example.com", ChangedAt), TestContext.Current.CancellationToken);

        _emailSender.EmailChangedEmails.ShouldBeEmpty();
    }
}
