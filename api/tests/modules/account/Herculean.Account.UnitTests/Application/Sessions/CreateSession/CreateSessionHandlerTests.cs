using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Sessions.CreateSession;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Sessions.CreateSession;

public sealed class CreateSessionHandlerTests
{
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly CreateSessionHandler _handler;

    public CreateSessionHandlerTests()
    {
        _handler = new CreateSessionHandler(new CreateSessionValidator(), _userRepository, _unitOfWork, new FakePasswordHasher(), new FakeTokenIssuer());
    }

    [Fact]
    public async Task RightEmailInAnyCaseAndPasswordSignIn()
    {
        User user = AddUser("hashed:password");

        Result<TokenResponse> result = await _handler.HandleAsync(new CreateSessionRequest("Filip@Example.COM", "password"), TestContext.Current.CancellationToken);

        result.Value.ShouldBe(FakeTokenIssuer.TokenResponse);
        user.RefreshTokens.ShouldHaveSingleItem();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task WrongPasswordIsInvalidCredentials()
    {
        User user = AddUser("hashed:password");

        Result<TokenResponse> result = await _handler.HandleAsync(new CreateSessionRequest("filip@example.com", "wrong"), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.InvalidCredentials);
        user.RefreshTokens.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task UnknownEmailIsTheSameInvalidCredentials()
    {
        Result<TokenResponse> result = await _handler.HandleAsync(new CreateSessionRequest("nobody@example.com", "password"), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.InvalidCredentials);
    }

    [Fact]
    public async Task PasswordHashedWithOlderSettingsIsHashedAgain()
    {
        User user = AddUser("old:password");

        await _handler.HandleAsync(new CreateSessionRequest("filip@example.com", "password"), TestContext.Current.CancellationToken);

        user.PasswordHash.ShouldBe("hashed:password");
    }

    [Fact]
    public async Task MissingFieldsFailWithFieldErrors()
    {
        Result<TokenResponse> result = await _handler.HandleAsync(new CreateSessionRequest("", ""), TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Fields.Keys.ShouldBe(["email", "password"], ignoreOrder: true);
    }

    private User AddUser(string passwordHash)
    {
        User user = User.Create("filip@example.com", passwordHash, "Europe/Zagreb");
        _userRepository.Add(user);
        return user;
    }
}
