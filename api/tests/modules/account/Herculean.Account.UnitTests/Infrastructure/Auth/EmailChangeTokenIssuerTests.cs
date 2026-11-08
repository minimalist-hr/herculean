using Herculean.Account.Domain.Users;
using Herculean.Account.Infrastructure.Auth;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

namespace Herculean.Account.UnitTests.Infrastructure.Auth;

public sealed class EmailChangeTokenIssuerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 8, 12, 0, 0, TimeSpan.Zero);

    private readonly EmailChangeTokenIssuer _issuer = new(
        Options.Create(new TokensOptions { EmailChangeLifetime = TimeSpan.FromHours(24) }),
        new FakeTimeProvider(Now));

    [Fact]
    public void StoresOnlyTheHashWithTheNewEmailAndLifetime()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        string token = _issuer.Issue(user, "New@Example.com");

        EmailChangeToken stored = user.EmailChangeTokens.ShouldHaveSingleItem();
        stored.TokenHash.ShouldBe(_issuer.Hash(token));
        stored.TokenHash.ShouldNotBe(token);
        stored.NewEmail.ShouldBe("new@example.com");
        stored.ExpiresAtUtc.ShouldBe(Now.AddHours(24));
    }
}
