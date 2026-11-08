using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Users.ChangePassword;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.Users.ChangePassword;

public sealed class ChangePasswordHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset Expiry = Now.AddDays(30);

    private readonly User _user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly ChangePasswordHandler _handler;

    public ChangePasswordHandlerTests()
    {
        _user.AddRefreshToken("hash:this-phone", Expiry);
        _user.AddRefreshToken("hash:tablet", Expiry);
        _userRepository.Add(_user);
        _currentUserAccessor.UserId = _user.Id.Value;
        _handler = new ChangePasswordHandler(
            new ChangePasswordValidator(),
            new CurrentUser(_currentUserAccessor),
            _userRepository,
            _unitOfWork,
            _outbox,
            new FakePasswordHasher(),
            new FakeTokenIssuer(),
            new FakeTimeProvider(Now));
    }

    [Fact]
    public async Task RightPasswordChangesItAndSignsOutEveryOtherDevice()
    {
        Result result = await _handler.HandleAsync(
            new ChangePasswordRequest("password", "new-password", "this-phone"),
            TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _user.PasswordHash.ShouldBe("hashed:new-password");
        _user.RefreshTokens.ShouldHaveSingleItem().TokenHash.ShouldBe("hash:this-phone");
        _outbox.Events.ShouldBe([new PasswordChangedIntegrationEvent(_user.Id.Value, Now)]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task WrongPasswordFailsUnderCurrentPasswordAndChangesNothing()
    {
        Result result = await _handler.HandleAsync(
            new ChangePasswordRequest("wrong", "new-password", "this-phone"),
            TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.WrongCurrentPassword);
        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("currentPassword");
        _user.PasswordHash.ShouldBe("hashed:password");
        _user.RefreshTokens.Count.ShouldBe(2);
        _outbox.Events.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AccountThatNoLongerExistsIsNotFound()
    {
        _currentUserAccessor.UserId = Guid.CreateVersion7();

        Result result = await _handler.HandleAsync(
            new ChangePasswordRequest("password", "new-password", "this-phone"),
            TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.NotFound);
    }

    [Theory]
    [InlineData("", "new-password", "this-phone", "currentPassword")]
    [InlineData("password", "short", "this-phone", "newPassword")]
    [InlineData("password", "new-password", "", "refreshToken")]
    public async Task InvalidRequestFailsWithAFieldError(string currentPassword, string newPassword, string refreshToken, string field)
    {
        Result result = await _handler.HandleAsync(
            new ChangePasswordRequest(currentPassword, newPassword, refreshToken),
            TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey(field);
    }
}
