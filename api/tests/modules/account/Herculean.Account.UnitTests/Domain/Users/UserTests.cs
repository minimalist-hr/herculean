using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Domain.Users;

public sealed class UserTests
{
    private static readonly DateTimeOffset ExpiresAt = new(2026, 11, 30, 18, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CreateStoresTheEmailTrimmedAndLowercase()
    {
        User user = User.Create("  Filip@Example.COM ", "hash", "Europe/Zagreb");

        user.Email.ShouldBe("filip@example.com");
    }

    [Fact]
    public void CreateKeepsThePasswordHashAndTimeZone()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        user.PasswordHash.ShouldBe("hash");
        user.TimeZone.ShouldBe("Europe/Zagreb");
        user.RefreshTokens.ShouldBeEmpty();
    }

    [Fact]
    public void AddRefreshTokenBelongsToTheUser()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        user.AddRefreshToken("token-hash", ExpiresAt);

        RefreshToken token = user.RefreshTokens.ShouldHaveSingleItem();
        token.UserId.ShouldBe(user.Id);
        token.TokenHash.ShouldBe("token-hash");
        token.ExpiresAtUtc.ShouldBe(ExpiresAt);
    }
}
