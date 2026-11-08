using Herculean.Account.Application.EmailChanges.ConfirmEmailChange;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.EmailChanges;

public sealed class ConfirmEmailChangeHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);

    private readonly User _user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly ConfirmEmailChangeHandler _handler;

    public ConfirmEmailChangeHandlerTests()
    {
        _userRepository.Add(_user);
        _handler = new ConfirmEmailChangeHandler(
            new ConfirmEmailChangeValidator(),
            _userRepository,
            _unitOfWork,
            _outbox,
            new FakeEmailChangeTokenIssuer(Now),
            new FakeTimeProvider(Now));
    }

    private Task<Result> ConfirmAsync(string token = "token") =>
        _handler.HandleAsync(new ConfirmEmailChangeRequest(token), TestContext.Current.CancellationToken);

    [Fact]
    public async Task AValidLinkChangesTheEmailAndCancelsResetLinks()
    {
        _user.AddEmailChangeToken("new@example.com", "hash:token", Now.AddMinutes(1));
        _user.AddPasswordResetToken("reset-hash", Now.AddMinutes(1));
        _user.AddRefreshToken("this-phone", Now.AddDays(1));

        Result result = await ConfirmAsync();

        result.IsSuccess.ShouldBeTrue();
        _user.Email.ShouldBe("new@example.com");
        _user.EmailChangeTokens.ShouldBeEmpty();
        _user.PasswordResetTokens.ShouldBeEmpty();
        _user.RefreshTokens.ShouldHaveSingleItem();
        _outbox.Events.ShouldBe([new EmailChangedIntegrationEvent(_user.Id.Value, "filip@example.com", Now)]);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownLinkIsInvalid()
    {
        Result result = await ConfirmAsync("unknown");

        result.Error.ShouldBe(UserErrors.InvalidEmailChangeToken);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AnExpiredLinkIsInvalidAndRemoved()
    {
        _user.AddEmailChangeToken("new@example.com", "hash:token", Now);

        Result result = await ConfirmAsync();

        result.Error.ShouldBe(UserErrors.InvalidEmailChangeToken);
        _user.Email.ShouldBe("filip@example.com");
        _user.EmailChangeTokens.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnAddressTakenSinceTheLinkWasSentFailsAndRemovesIt()
    {
        _userRepository.Add(User.Create("new@example.com", "hash", "Europe/Zagreb"));
        _user.AddEmailChangeToken("new@example.com", "hash:token", Now.AddMinutes(1));

        Result result = await ConfirmAsync();

        result.Error.ShouldBe(UserErrors.EmailTaken);
        _user.Email.ShouldBe("filip@example.com");
        _user.EmailChangeTokens.ShouldBeEmpty();
        _outbox.Events.ShouldBeEmpty();
    }

    [Fact]
    public async Task AMissingTokenFailsWithAFieldError()
    {
        Result result = await ConfirmAsync(string.Empty);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("token");
    }
}
