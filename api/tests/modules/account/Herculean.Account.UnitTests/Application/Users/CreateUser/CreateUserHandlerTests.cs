using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Users.CreateUser;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Users.CreateUser;

public sealed class CreateUserHandlerTests
{
    private static readonly CreateUserRequest Request = new("Filip@Example.com", "password", "Europe/Zagreb");

    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeOutbox _outbox = new();
    private readonly CreateUserHandler _handler;

    public CreateUserHandlerTests()
    {
        _handler = new CreateUserHandler(new CreateUserValidator(), _userRepository, _unitOfWork, _outbox, new FakePasswordHasher(), new FakeTokenIssuer());
    }

    [Fact]
    public async Task CreatesTheUserAndReturnsTokens()
    {
        Result<TokenResponse> result = await _handler.HandleAsync(Request, TestContext.Current.CancellationToken);

        result.Value.ShouldBe(FakeTokenIssuer.TokenResponse);
        User user = _userRepository.Users.ShouldHaveSingleItem();
        user.Email.ShouldBe("filip@example.com");
        user.PasswordHash.ShouldBe("hashed:password");
        user.TimeZone.ShouldBe("Europe/Zagreb");
        user.RefreshTokens.ShouldHaveSingleItem();
        _unitOfWork.Saved.ShouldBeTrue();
        _outbox.Events.ShouldHaveSingleItem().ShouldBe(new AccountCreatedIntegrationEvent(user.Id.Value));
    }

    [Fact]
    public async Task InvalidRequestFailsWithFieldErrors()
    {
        Result<TokenResponse> result = await _handler.HandleAsync(Request with { Password = "short" }, TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("password");
        _userRepository.Users.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
        _outbox.Events.ShouldBeEmpty();
    }

    [Fact]
    public async Task TakenEmailFailsRegardlessOfCase()
    {
        _userRepository.Add(User.Create("filip@example.com", "hash", "Europe/Zagreb"));

        Result<TokenResponse> result = await _handler.HandleAsync(Request, TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.EmailTaken);
        _userRepository.Users.Count.ShouldBe(1);
        _unitOfWork.Saved.ShouldBeFalse();
        _outbox.Events.ShouldBeEmpty();
    }
}
