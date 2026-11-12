using System.Linq.Expressions;

using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class RefreshToken : Entity<RefreshTokenId>
{
    // Long enough for a phone on a weak signal to try again after losing the answer that held the new token.
    internal static readonly TimeSpan ReplacedGracePeriod = TimeSpan.FromMinutes(5);

    private RefreshToken(RefreshTokenId id, UserId userId, string tokenHash, DateTimeOffset expiresAtUtc) : base(id)
    {
        UserId = userId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
    }

    public UserId UserId { get; private set; }

    public string TokenHash { get; private set; }

    public DateTimeOffset ExpiresAtUtc { get; private set; }

    public DateTimeOffset? ReplacedAtUtc { get; private set; }

    public bool IsExpired(DateTimeOffset nowUtc) => ExpiresAtUtc <= nowUtc;

    public bool IsPastGracePeriod(DateTimeOffset nowUtc) => ReplacedAtUtc + ReplacedGracePeriod <= nowUtc;

    /// <summary>Expired, or replaced and past its grace period, so the database can delete it.</summary>
    internal static Expression<Func<RefreshToken, bool>> CanNeverBeUsed(DateTimeOffset nowUtc)
    {
        DateTimeOffset replacedBy = nowUtc - ReplacedGracePeriod;

        return token => token.ExpiresAtUtc <= nowUtc || token.ReplacedAtUtc <= replacedBy;
    }

    internal static RefreshToken Create(UserId userId, string tokenHash, DateTimeOffset expiresAtUtc) =>
        new(RefreshTokenId.New(), userId, tokenHash, expiresAtUtc);

    internal void MarkReplaced(DateTimeOffset nowUtc) => ReplacedAtUtc ??= nowUtc;
}
