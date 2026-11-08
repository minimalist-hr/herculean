using Herculean.Account.Application.EmailChanges.EmailChangeRequested;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.EmailChanges;

public sealed class EmailChangeRequestedIntegrationEventHandlerTests
{
    private static readonly DateTimeOffset Expiry = new(2026, 11, 9, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeEmailSender _emailSender = new();
    private readonly EmailChangeRequestedIntegrationEventHandler _handler;

    public EmailChangeRequestedIntegrationEventHandlerTests()
    {
        _userRepository.Add(_user);
        _handler = new EmailChangeRequestedIntegrationEventHandler(_userRepository, _unitOfWork, new FakeEmailChangeTokenIssuer(Expiry), _emailSender);
    }

    [Fact]
    public async Task SavesATokenThenSendsTheLinkToTheNewAddress()
    {
        await _handler.HandleAsync(new EmailChangeRequestedIntegrationEvent(_user.Id.Value, "new@example.com"), TestContext.Current.CancellationToken);

        _user.EmailChangeTokens.ShouldHaveSingleItem().NewEmail.ShouldBe("new@example.com");
        _unitOfWork.Saved.ShouldBeTrue();
        _emailSender.EmailChangeLinks.ShouldBe([new SentEmail("new@example.com", "token")]);
    }

    [Fact]
    public async Task ANewLinkCancelsTheOlderOne()
    {
        _user.AddEmailChangeToken("older@example.com", "hash:older", Expiry);

        await _handler.HandleAsync(new EmailChangeRequestedIntegrationEvent(_user.Id.Value, "new@example.com"), TestContext.Current.CancellationToken);

        _user.EmailChangeTokens.ShouldHaveSingleItem().TokenHash.ShouldBe("hash:token");
    }

    [Fact]
    public async Task AnEventRepeatedAfterTheChangeSendsNothing()
    {
        _user.ChangeEmail("new@example.com");

        await _handler.HandleAsync(new EmailChangeRequestedIntegrationEvent(_user.Id.Value, "new@example.com"), TestContext.Current.CancellationToken);

        _emailSender.EmailChangeLinks.ShouldBeEmpty();
    }

    [Fact]
    public async Task SendsNothingOnceTheAccountIsGone()
    {
        await _handler.HandleAsync(new EmailChangeRequestedIntegrationEvent(Guid.CreateVersion7(), "new@example.com"), TestContext.Current.CancellationToken);

        _emailSender.EmailChangeLinks.ShouldBeEmpty();
    }
}
