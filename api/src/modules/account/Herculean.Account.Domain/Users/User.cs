using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class User : Entity<UserId>
{
    internal const int NameMaxLength = 50;

    private readonly List<RefreshToken> _refreshTokens = [];

    private User(UserId id, string email, string passwordHash, string timeZone) : base(id)
    {
        Email = email;
        PasswordHash = passwordHash;
        TimeZone = timeZone;
    }

    public string Email { get; private set; }

    public string PasswordHash { get; private set; }

    /// <summary>Empty until setup.</summary>
    public string? Name { get; private set; }

    public Units Units { get; private set; } = Units.Metric;

    /// <summary>An IANA name, for example <c>Europe/Zagreb</c>.</summary>
    public string TimeZone { get; private set; }

    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens;

    public static User Create(string email, string passwordHash, string timeZone) =>
        new(UserId.New(), NormalizeEmail(email), passwordHash, timeZone);

    /// <summary>Emails are stored this way, so they are unique regardless of case.</summary>
    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public void ChangeName(string name)
    {
        Name = name.Trim();
    }

    public void ChangeUnits(Units units)
    {
        Units = units;
    }

    public void ChangeTimeZone(string timeZone)
    {
        TimeZone = timeZone;
    }

    /// <summary>For a new hash of the same password, when the hasher's settings get stronger.</summary>
    public void ChangePasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
    }

    public void AddRefreshToken(string tokenHash, DateTimeOffset expiresAtUtc)
    {
        _refreshTokens.Add(RefreshToken.Create(Id, tokenHash, expiresAtUtc));
    }

    /// <summary>A refresh token works once: refreshing removes it, and so does signing out.</summary>
    public void RemoveRefreshToken(RefreshToken refreshToken)
    {
        _refreshTokens.Remove(refreshToken);
    }
}
