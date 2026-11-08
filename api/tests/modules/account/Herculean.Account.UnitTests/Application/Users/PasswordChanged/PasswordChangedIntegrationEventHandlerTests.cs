using Herculean.Account.Application.Users.PasswordChanged;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.Users.PasswordChanged;

public sealed class PasswordChangedIntegrationEventHandlerTests
{
    private static readonly DateTimeOffset ChangedAt = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeEmailSender _emailSender = new();
    private readonly PasswordChangedIntegrationEventHandler _handler;

    public PasswordChangedIntegrationEventHandlerTests()
    {
        _handler = new PasswordChangedIntegrationEventHandler(_userRepository, _emailSender);
    }

    [Fact]
    public async Task EmailsTheUserWithTheTimeAndTheirTimeZone()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        _userRepository.Add(user);

        await _handler.HandleAsync(new PasswordChangedIntegrationEvent(user.Id.Value, ChangedAt), TestContext.Current.CancellationToken);

        _emailSender.PasswordChangedEmails.ShouldBe([new SentPasswordChangedEmail("filip@example.com", ChangedAt, "Europe/Zagreb")]);
    }

    [Fact]
    public async Task SendsNothingOnceTheAccountIsGone()
    {
        await _handler.HandleAsync(new PasswordChangedIntegrationEvent(Guid.CreateVersion7(), ChangedAt), TestContext.Current.CancellationToken);

        _emailSender.PasswordChangedEmails.ShouldBeEmpty();
    }
}
