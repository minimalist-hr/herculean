using Herculean.Account.Application.Users.AccountKept;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Application.Users.AccountKept;

public sealed class AccountKeptIntegrationEventHandlerTests
{
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeEmailSender _emailSender = new();
    private readonly AccountKeptIntegrationEventHandler _handler;

    public AccountKeptIntegrationEventHandlerTests()
    {
        _handler = new AccountKeptIntegrationEventHandler(_userRepository, _emailSender);
    }

    [Fact]
    public async Task EmailsTheUser()
    {
        User user = User.Create("ana@example.com", "hash", "Europe/Zagreb");
        _userRepository.Add(user);

        await _handler.HandleAsync(new AccountKeptIntegrationEvent(user.Id.Value), TestContext.Current.CancellationToken);

        _emailSender.AccountKeptEmails.ShouldBe(["ana@example.com"]);
    }

    [Fact]
    public async Task SendsNothingOnceTheAccountIsGone()
    {
        await _handler.HandleAsync(new AccountKeptIntegrationEvent(Guid.CreateVersion7()), TestContext.Current.CancellationToken);

        _emailSender.AccountKeptEmails.ShouldBeEmpty();
    }
}
