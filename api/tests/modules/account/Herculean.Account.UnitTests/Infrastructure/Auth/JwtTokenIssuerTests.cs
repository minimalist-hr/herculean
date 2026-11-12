using System.Text;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Auth;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Herculean.Account.UnitTests.Infrastructure.Auth;

public sealed class JwtTokenIssuerTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 31, 18, 0, 0, TimeSpan.Zero);

    private static readonly JwtOptions Jwt = new()
    {
        Issuer = "herculean-api",
        Audience = "herculean-app",
        SigningKey = new string('k', 32),
        AccessTokenLifetime = TimeSpan.FromMinutes(15),
        RefreshTokenLifetime = TimeSpan.FromDays(30),
    };

    private readonly JwtTokenIssuer _issuer = new(Options.Create(Jwt), new FakeTimeProvider(Now));
    private readonly User _user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

    [Fact]
    public void AUsersTokenHasNoRole()
    {
        new JsonWebToken(_issuer.Issue(_user).AccessToken).TryGetPayloadValue("role", out string _).ShouldBeFalse();
    }

    [Fact]
    public void AnAdminsTokenSaysAdmin()
    {
        User admin = User.CreateAdmin("admin@minimalist.hr", "hash");

        new JsonWebToken(_issuer.Issue(admin).AccessToken).GetPayloadValue<string>("role").ShouldBe("admin");
    }

    [Fact]
    public async Task AccessTokenIsSignedForTheUser()
    {
        TokenResponse tokens = _issuer.Issue(_user);

        TokenValidationResult result = await new JsonWebTokenHandler().ValidateTokenAsync(tokens.AccessToken, new TokenValidationParameters
        {
            ValidIssuer = Jwt.Issuer,
            ValidAudience = Jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Jwt.SigningKey)),
            // The fake clock is not the real one.
            ValidateLifetime = false,
        });

        result.IsValid.ShouldBeTrue();
        JsonWebToken token = result.SecurityToken.ShouldBeOfType<JsonWebToken>();
        token.Subject.ShouldBe(_user.Id.Value.ToString());
        token.ValidTo.ShouldBe((Now + Jwt.AccessTokenLifetime).UtcDateTime);
    }

    [Fact]
    public void ExpiresInIsTheAccessTokenLifetimeInSeconds()
    {
        _issuer.Issue(_user).ExpiresIn.ShouldBe(900);
    }

    [Fact]
    public void RefreshTokenIsStoredOnlyAsItsHash()
    {
        TokenResponse tokens = _issuer.Issue(_user);

        RefreshToken stored = _user.RefreshTokens.ShouldHaveSingleItem();
        stored.TokenHash.ShouldBe(_issuer.HashRefreshToken(tokens.RefreshToken));
        stored.TokenHash.ShouldNotBe(tokens.RefreshToken);
        stored.ExpiresAtUtc.ShouldBe(Now + Jwt.RefreshTokenLifetime);
    }

    [Fact]
    public void IssuingMarksTheUserActive()
    {
        _issuer.Issue(_user);

        _user.LastActiveUtc.ShouldBe(Now);
    }

    [Fact]
    public void EachRefreshTokenIsNew()
    {
        _issuer.Issue(_user).RefreshToken.ShouldNotBe(_issuer.Issue(_user).RefreshToken);
    }
}
