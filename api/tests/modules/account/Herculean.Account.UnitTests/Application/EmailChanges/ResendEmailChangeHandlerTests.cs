using Herculean.Account.Application.Auth;
using Herculean.Account.Application.EmailChanges.ResendEmailChange;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.EmailChanges;

public sealed class ResendEmailChangeHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly ResendEmailChangeHandler _handler;

    public ResendEmailChangeHandlerTests()
    {
        _userRepository.Add(_user);
        _currentUserAccessor.UserId = _user.Id.Value;
        _handler = new ResendEmailChangeHandler(new CurrentUser(_currentUserAccessor), _userRepository, _unitOfWork, _outbox, new FakeTimeProvider(Now));
    }

    [Fact]
    public async Task AWaitingAddressGetsANewLink()
    {
        _user.AddEmailChangeToken("new@example.com", "hash:token", Now.AddMinutes(1));

        Result result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _outbox.Events.ShouldBe([new EmailChangeRequestedIntegrationEvent(_user.Id.Value, "new@example.com")]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task NothingWaitingIsNotFound()
    {
        _user.AddEmailChangeToken("new@example.com", "hash:token", Now);

        Result result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NoPendingEmailChange);
        _outbox.Events.ShouldBeEmpty();
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _currentUserAccessor.UserId = Guid.CreateVersion7();

        Result result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }
}
