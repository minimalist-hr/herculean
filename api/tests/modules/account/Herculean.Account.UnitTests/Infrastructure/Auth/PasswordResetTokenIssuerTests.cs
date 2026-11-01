using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Auth;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Infrastructure.Auth;

public sealed class PasswordResetTokenIssuerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 1, 12, 0, 0, TimeSpan.Zero);

    private readonly PasswordResetTokenIssuer _issuer = new(
        Options.Create(new TokensOptions { ResetLinkLifetime = TimeSpan.FromHours(1) }),
        new FakeTimeProvider(Now));

    [Fact]
    public void IssuedTokenIsStoredHashedWithItsLifetime()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        string token = _issuer.Issue(user);

        PasswordResetToken stored = user.PasswordResetTokens.ShouldHaveSingleItem();
        stored.TokenHash.ShouldBe(_issuer.Hash(token));
        stored.TokenHash.ShouldNotBe(token);
        stored.ExpiresAtUtc.ShouldBe(Now.AddHours(1));
    }

    [Fact]
    public void EachTokenIsNew()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        _issuer.Issue(user).ShouldNotBe(_issuer.Issue(user));
    }
}
