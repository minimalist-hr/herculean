using Herculean.Account.Application.PasswordResets.CompletePasswordReset;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.PasswordResets.CompletePasswordReset;

public sealed class CompletePasswordResetHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 1, 12, 0, 0, TimeSpan.Zero);

    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly User _user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
    private readonly CompletePasswordResetHandler _handler;

    public CompletePasswordResetHandlerTests()
    {
        _userRepository.Add(_user);
        _handler = new CompletePasswordResetHandler(
            new CompletePasswordResetValidator(),
            _userRepository,
            _unitOfWork,
            new FakePasswordResetTokenIssuer(),
            new FakePasswordHasher(),
            new FakeTimeProvider(Now));
    }

    [Fact]
    public async Task ValidTokenChangesThePasswordAndSignsOutEveryDevice()
    {
        _user.AddPasswordResetToken("hash:token", Now.AddMinutes(1));
        _user.AddRefreshToken("refresh-hash", Now.AddDays(1));

        Result result = await _handler.HandleAsync(new CompletePasswordResetRequest("token", "new-password"), TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _user.PasswordHash.ShouldBe("hashed:new-password");
        _user.PasswordResetTokens.ShouldBeEmpty();
        _user.RefreshTokens.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task UnknownTokenIsInvalid()
    {
        Result result = await _handler.HandleAsync(new CompletePasswordResetRequest("unknown", "new-password"), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.InvalidPasswordResetToken);
        _user.PasswordHash.ShouldBe("hashed:password");
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ExpiredTokenIsInvalidAndRemoved()
    {
        _user.AddPasswordResetToken("hash:token", Now);

        Result result = await _handler.HandleAsync(new CompletePasswordResetRequest("token", "new-password"), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.InvalidPasswordResetToken);
        _user.PasswordHash.ShouldBe("hashed:password");
        _user.PasswordResetTokens.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Theory]
    [InlineData("", "new-password", "token")]
    [InlineData("token", "short", "password")]
    public async Task InvalidRequestFailsWithAFieldError(string token, string password, string field)
    {
        Result result = await _handler.HandleAsync(new CompletePasswordResetRequest(token, password), TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey(field);
    }
}
