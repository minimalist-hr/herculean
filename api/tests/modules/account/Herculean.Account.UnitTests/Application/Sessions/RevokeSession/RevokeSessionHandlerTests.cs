using Herculean.Account.Application.Sessions.RevokeSession;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.UnitTests.Application.Sessions.RevokeSession;

public sealed class RevokeSessionHandlerTests
{
    private readonly User _user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly RevokeSessionHandler _handler;

    public RevokeSessionHandlerTests()
    {
        _user.AddRefreshToken("hash:this-phone", DateTimeOffset.MaxValue);
        _user.AddRefreshToken("hash:tablet", DateTimeOffset.MaxValue);
        _userRepository.Add(_user);
        _handler = new RevokeSessionHandler(new RevokeSessionValidator(), _userRepository, _unitOfWork, new FakeTokenIssuer());
    }

    [Fact]
    public async Task OnlyThisDeviceIsSignedOut()
    {
        Result result = await _handler.HandleAsync(new RevokeSessionRequest("this-phone"), TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _user.RefreshTokens.ShouldHaveSingleItem().TokenHash.ShouldBe("hash:tablet");
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AnUnknownTokenIsStillASuccess()
    {
        Result result = await _handler.HandleAsync(new RevokeSessionRequest("unknown"), TestContext.Current.CancellationToken);

        result.IsSuccess.ShouldBeTrue();
        _user.RefreshTokens.Count.ShouldBe(2);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task AMissingTokenFailsWithAFieldError()
    {
        Result result = await _handler.HandleAsync(new RevokeSessionRequest(string.Empty), TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Type.ShouldBe(ErrorType.Validation);
        result.Error.Fields.ShouldContainKey("refreshToken");
    }
}
