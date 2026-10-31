using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class RefreshToken : Entity<RefreshTokenId>
{
    private RefreshToken(RefreshTokenId id, UserId userId, string tokenHash, DateTimeOffset expiresAtUtc) : base(id)
    {
        UserId = userId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
    }

    public UserId UserId { get; private set; }

    public string TokenHash { get; private set; }

    public DateTimeOffset ExpiresAtUtc { get; private set; }

    internal static RefreshToken Create(UserId userId, string tokenHash, DateTimeOffset expiresAtUtc) =>
        new(RefreshTokenId.New(), userId, tokenHash, expiresAtUtc);
}
