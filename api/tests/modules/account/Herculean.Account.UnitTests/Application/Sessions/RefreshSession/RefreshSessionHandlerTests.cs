using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Sessions.RefreshSession;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Application.Sessions.RefreshSession;

public sealed class RefreshSessionHandlerTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 31, 18, 0, 0, TimeSpan.Zero);

    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly User _user = User.Create("filip@example.com", "hashed:password", "Europe/Zagreb");
    private readonly RefreshSessionHandler _handler;

    public RefreshSessionHandlerTests()
    {
        _userRepository.Add(_user);
        _handler = new RefreshSessionHandler(new RefreshSessionValidator(), _userRepository, _unitOfWork, new FakeTokenIssuer(), new FakeTimeProvider(Now));
    }

    [Fact]
    public async Task ValidTokenIsSwappedForNewTokens()
    {
        _user.AddRefreshToken("hash:old", Now.AddDays(1));

        Result<TokenResponse> result = await _handler.HandleAsync(new RefreshSessionRequest("old"), TestContext.Current.CancellationToken);

        result.Value.ShouldBe(FakeTokenIssuer.TokenResponse);
        _user.RefreshTokens.ShouldContain(token => token.TokenHash == "refresh-hash");
        _user.RefreshTokens.Single(token => token.TokenHash == "hash:old").ReplacedAtUtc.ShouldBe(Now);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task AReplacedTokenStillWorksWhenTheAnswerWasLost()
    {
        _user.AddRefreshToken("hash:old", Now.AddDays(1));
        _user.ReplaceRefreshToken(_user.RefreshTokens[0], Now.AddMinutes(-4));

        Result<TokenResponse> result = await _handler.HandleAsync(new RefreshSessionRequest("old"), TestContext.Current.CancellationToken);

        result.Value.ShouldBe(FakeTokenIssuer.TokenResponse);
        _user.RefreshTokens.Single(token => token.TokenHash == "hash:old").ReplacedAtUtc.ShouldBe(Now.AddMinutes(-4));
    }

    [Fact]
    public async Task AReplacedTokenStopsWorkingAfterTheGracePeriod()
    {
        _user.AddRefreshToken("hash:old", Now.AddDays(1));
        _user.ReplaceRefreshToken(_user.RefreshTokens[0], Now - RefreshToken.ReplacedGracePeriod);

        Result<TokenResponse> result = await _handler.HandleAsync(new RefreshSessionRequest("old"), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.InvalidRefreshToken);
        _user.RefreshTokens.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task RefreshingClearsTokensPastTheGracePeriod()
    {
        _user.AddRefreshToken("hash:older", Now.AddDays(1));
        _user.ReplaceRefreshToken(_user.RefreshTokens[0], Now - RefreshToken.ReplacedGracePeriod);
        _user.AddRefreshToken("hash:old", Now.AddDays(1));

        await _handler.HandleAsync(new RefreshSessionRequest("old"), TestContext.Current.CancellationToken);

        _user.RefreshTokens.ShouldNotContain(token => token.TokenHash == "hash:older");
    }

    [Fact]
    public async Task UnknownTokenIsInvalid()
    {
        Result<TokenResponse> result = await _handler.HandleAsync(new RefreshSessionRequest("unknown"), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.InvalidRefreshToken);
        _unitOfWork.Saved.ShouldBeFalse();
    }

    [Fact]
    public async Task ExpiredTokenIsInvalidAndRemoved()
    {
        _user.AddRefreshToken("hash:old", Now);

        Result<TokenResponse> result = await _handler.HandleAsync(new RefreshSessionRequest("old"), TestContext.Current.CancellationToken);

        result.Error.ShouldBe(UserErrors.InvalidRefreshToken);
        _user.RefreshTokens.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task MissingTokenFailsWithAFieldError()
    {
        Result<TokenResponse> result = await _handler.HandleAsync(new RefreshSessionRequest(""), TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("refreshToken");
    }
}
