using Herculean.Account.Domain.Users;

namespace Herculean.Account.UnitTests.Domain.Users;

public sealed class TokenExpiryTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 22, 12, 0, 0, TimeSpan.Zero);

    private static readonly UserId Owner = UserId.New();

    [Fact]
    public void ARefreshTokenThatExpiredCanNeverBeUsed()
    {
        RefreshToken token = RefreshToken.Create(Owner, "hash", Now);

        RefreshToken.CanNeverBeUsed(Now).Compile()(token).ShouldBeTrue();
    }

    [Fact]
    public void AReplacedRefreshTokenCanBeUsedUntilItsGracePeriodIsOver()
    {
        RefreshToken token = RefreshToken.Create(Owner, "hash", Now.AddDays(30));
        token.MarkReplaced(Now);

        RefreshToken.CanNeverBeUsed(Now.AddMinutes(4)).Compile()(token).ShouldBeFalse();
        RefreshToken.CanNeverBeUsed(Now.AddMinutes(5)).Compile()(token).ShouldBeTrue();
    }

    [Fact]
    public void ARefreshTokenInUseIsKept()
    {
        RefreshToken token = RefreshToken.Create(Owner, "hash", Now.AddDays(30));

        RefreshToken.CanNeverBeUsed(Now).Compile()(token).ShouldBeFalse();
    }

    [Fact]
    public void APasswordResetTokenIsExpiredFromItsExpiryOn()
    {
        PasswordResetToken token = PasswordResetToken.Create(Owner, "hash", Now);

        PasswordResetToken.Expired(Now.AddSeconds(-1)).Compile()(token).ShouldBeFalse();
        PasswordResetToken.Expired(Now).Compile()(token).ShouldBeTrue();
    }

    [Fact]
    public void AnEmailChangeTokenIsExpiredFromItsExpiryOn()
    {
        EmailChangeToken token = EmailChangeToken.Create(Owner, "new@example.com", "hash", Now);

        EmailChangeToken.Expired(Now.AddSeconds(-1)).Compile()(token).ShouldBeFalse();
        EmailChangeToken.Expired(Now).Compile()(token).ShouldBeTrue();
    }
}
