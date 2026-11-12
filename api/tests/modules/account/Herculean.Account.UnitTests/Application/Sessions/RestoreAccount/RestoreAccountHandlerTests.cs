using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Sessions.RestoreAccount;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Sessions.RestoreAccount;

public sealed class RestoreAccountHandlerTests
{
    private readonly User _user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly RestoreAccountHandler _handler;

    public RestoreAccountHandlerTests()
    {
        _user.ScheduleDeletion(DateTimeOffset.UnixEpoch);
        _userRepository.Add(_user);
        _handler = new RestoreAccountHandler(new RestoreAccountValidator(), _userRepository, _unitOfWork, new FakePasswordHasher(), new FakeTokenIssuer());
    }

    private Task<Result<TokenResponse>> RestoreAsync(string email, string password) =>
        _handler.HandleAsync(new RestoreAccountRequest(email, password), TestContext.Current.CancellationToken);

    [Fact]
    public async Task AClosedAccountCantBeKept()
    {
        _user.Close(DateTimeOffset.UnixEpoch);

        Result<TokenResponse> result = await RestoreAsync("filip@example.com", "password");

        result.Error.ShouldBe(UserErrors.AccountClosed);
        _user.IsClosed.ShouldBeTrue();
    }

    [Fact]
    public async Task RightPasswordKeepsTheAccountAndSignsIn()
    {
        Result<TokenResponse> result = await RestoreAsync("filip@example.com", "password");

        result.Value.ShouldBe(FakeTokenIssuer.TokenResponse);
        _user.DeletionScheduledForUtc.ShouldBeNull();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Theory]
    [InlineData("filip@example.com", "wrong")]
    [InlineData("nobody@example.com", "password")]
    public async Task WrongDetailsKeepItScheduled(string email, string password)
    {
        Result<TokenResponse> result = await RestoreAsync(email, password);

        result.Error.ShouldBe(UserErrors.InvalidCredentials);
        _user.DeletionScheduledForUtc.ShouldNotBeNull();
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Theory]
    [InlineData("", "password", "email")]
    [InlineData("filip@example.com", "", "password")]
    public async Task MissingDetailsFailWithAFieldError(string email, string password, string field)
    {
        Result<TokenResponse> result = await RestoreAsync(email, password);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey(field);
    }
}
