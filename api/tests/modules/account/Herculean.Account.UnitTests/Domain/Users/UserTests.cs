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

    [Fact]
    public void NewUserHasNoNameAndMetricUnits()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        user.Name.ShouldBeNull();
        user.Units.ShouldBe(Units.Metric);
    }

    [Fact]
    public void ChangesAreKeptWithTheNameTrimmed()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        user.ChangeName("  Filip  ");
        user.ChangeUnits(Units.Imperial);
        user.ChangeTimeZone("Europe/London");

        user.Name.ShouldBe("Filip");
        user.Units.ShouldBe(Units.Imperial);
        user.TimeZone.ShouldBe("Europe/London");
    }

    [Fact]
    public void NewPasswordResetTokenCancelsTheOlderOne()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        user.AddPasswordResetToken("old", DateTimeOffset.UnixEpoch);
        user.AddPasswordResetToken("new", DateTimeOffset.UnixEpoch);

        user.PasswordResetTokens.ShouldHaveSingleItem().TokenHash.ShouldBe("new");
    }

    [Fact]
    public void ResetPasswordChangesTheHashAndRemovesEveryToken()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        user.AddPasswordResetToken("reset", DateTimeOffset.UnixEpoch);
        user.AddRefreshToken("phone", DateTimeOffset.UnixEpoch);
        user.AddRefreshToken("tablet", DateTimeOffset.UnixEpoch);

        user.ResetPassword("new-hash");

        user.PasswordHash.ShouldBe("new-hash");
        user.PasswordResetTokens.ShouldBeEmpty();
        user.RefreshTokens.ShouldBeEmpty();
    }

    [Fact]
    public void ANewUserHasNotBeenActive()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");

        user.LastActiveUtc.ShouldBeNull();
        user.MarkActive(DateTimeOffset.UnixEpoch);
        user.LastActiveUtc.ShouldBe(DateTimeOffset.UnixEpoch);
    }

    [Fact]
    public void CloseSchedulesTheDeletionAndCancelOpensItAgain()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        user.AddRefreshToken("phone", DateTimeOffset.UnixEpoch);

        user.Close(DateTimeOffset.UnixEpoch);

        user.IsClosed.ShouldBeTrue();
        user.DeletionScheduledForUtc.ShouldBe(DateTimeOffset.UnixEpoch.AddDays(14));
        user.RefreshTokens.ShouldBeEmpty();
        user.CancelDeletion();
        user.IsClosed.ShouldBeFalse();
    }

    [Fact]
    public void SignOutEverywhereRemovesEveryRefreshToken()
    {
        User user = User.Create("filip@example.com", "hash", "Europe/Zagreb");
        user.AddRefreshToken("phone", DateTimeOffset.UnixEpoch);
        user.AddRefreshToken("tablet", DateTimeOffset.UnixEpoch);

        user.SignOutEverywhere();

        user.RefreshTokens.ShouldBeEmpty();
    }
}
