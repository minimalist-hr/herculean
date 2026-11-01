using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class PasswordResetToken : Entity<PasswordResetTokenId>
{
    private PasswordResetToken(PasswordResetTokenId id, UserId userId, string tokenHash, DateTimeOffset expiresAtUtc) : base(id)
    {
        UserId = userId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
    }

    public UserId UserId { get; private set; }

    public string TokenHash { get; private set; }

    public DateTimeOffset ExpiresAtUtc { get; private set; }

    public bool IsExpired(DateTimeOffset nowUtc) => ExpiresAtUtc <= nowUtc;

    internal static PasswordResetToken Create(UserId userId, string tokenHash, DateTimeOffset expiresAtUtc) =>
        new(PasswordResetTokenId.New(), userId, tokenHash, expiresAtUtc);
}
