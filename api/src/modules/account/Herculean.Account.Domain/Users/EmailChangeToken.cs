using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class EmailChangeToken : Entity<EmailChangeTokenId>
{
    private EmailChangeToken(EmailChangeTokenId id, UserId userId, string newEmail, string tokenHash, DateTimeOffset expiresAtUtc) : base(id)
    {
        UserId = userId;
        NewEmail = newEmail;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
    }

    public UserId UserId { get; private set; }

    public string NewEmail { get; private set; }

    public string TokenHash { get; private set; }

    public DateTimeOffset ExpiresAtUtc { get; private set; }

    public bool IsExpired(DateTimeOffset nowUtc) => ExpiresAtUtc <= nowUtc;

    internal static EmailChangeToken Create(UserId userId, string newEmail, string tokenHash, DateTimeOffset expiresAtUtc) =>
        new(EmailChangeTokenId.New(), userId, newEmail, tokenHash, expiresAtUtc);
}
