using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class User : Entity<UserId>
{
    private readonly List<RefreshToken> _refreshTokens = [];

    private User(UserId id, string email, string passwordHash, string timeZone) : base(id)
    {
        Email = email;
        PasswordHash = passwordHash;
        TimeZone = timeZone;
    }

    public string Email { get; private set; }

    public string PasswordHash { get; private set; }

    /// <summary>An IANA name, for example <c>Europe/Zagreb</c>.</summary>
    public string TimeZone { get; private set; }

    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens;

    public static User Create(string email, string passwordHash, string timeZone) =>
        new(UserId.New(), NormalizeEmail(email), passwordHash, timeZone);

    /// <summary>Emails are stored this way, so they are unique regardless of case.</summary>
    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public void AddRefreshToken(string tokenHash, DateTimeOffset expiresAtUtc)
    {
        _refreshTokens.Add(RefreshToken.Create(Id, tokenHash, expiresAtUtc));
    }
}
