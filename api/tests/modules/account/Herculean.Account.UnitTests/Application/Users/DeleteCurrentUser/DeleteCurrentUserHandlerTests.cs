using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Users.DeleteCurrentUser;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.Users.DeleteCurrentUser;

public sealed class DeleteCurrentUserHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly DeleteCurrentUserHandler _handler;

    public DeleteCurrentUserHandlerTests()
    {
        _userRepository.Add(_user);
        _currentUserAccessor.UserId = _user.Id.Value;
        _handler = new DeleteCurrentUserHandler(
            new DeleteCurrentUserValidator(),
            new CurrentUser(_currentUserAccessor),
            _userRepository,
            _unitOfWork,
            _outbox,
            new FakePasswordHasher(),
            new FakeTimeProvider(Now));
    }

    private Task<Result> DeleteAsync(string password) =>
        _handler.HandleAsync(new DeleteCurrentUserRequest(password), TestContext.Current.CancellationToken);

    [Fact]
    public async Task RightPasswordDeletesTheAccountAndTellsEveryone()
    {
        Result result = await DeleteAsync("password");

        result.IsSuccess.ShouldBeTrue();
        _userRepository.Users.ShouldBeEmpty();
        _outbox.Events.ShouldBe(
        [
            new AccountDeletedIntegrationEvent(_user.Id.Value),
            new AccountDeletionNoticeRequestedIntegrationEvent("filip@example.com", Now, "Europe/Zagreb"),
        ]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task WrongPasswordFailsUnderCurrentPasswordAndDeletesNothing()
    {
        Result result = await DeleteAsync("wrong");

        result.Error.ShouldBe(UserErrors.WrongCurrentPassword);
        _userRepository.Users.ShouldHaveSingleItem();
        _outbox.Events.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _currentUserAccessor.UserId = Guid.CreateVersion7();

        Result result = await DeleteAsync("password");

        result.Error.ShouldBe(UserErrors.NotFound);
    }

    [Fact]
    public async Task AMissingPasswordFailsWithAFieldError()
    {
        Result result = await DeleteAsync(string.Empty);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("currentPassword");
    }
}
