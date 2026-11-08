using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class User : Entity<UserId>
{
    internal const int NameMaxLength = 50;

    /// <summary>How long a deleted account can still be kept. Must match the copy on H19, A07 and H21.</summary>
    internal static readonly TimeSpan DeletionWait = TimeSpan.FromDays(14);

    private readonly List<RefreshToken> _refreshTokens = [];
    private readonly List<PasswordResetToken> _passwordResetTokens = [];
    private readonly List<EmailChangeToken> _emailChangeTokens = [];

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

    public Theme Theme { get; private set; } = Theme.MatchPhone;

    public Color Color { get; private set; } = Color.Nitro;

    /// <summary>An IANA name, for example <c>Europe/Zagreb</c>.</summary>
    public string TimeZone { get; private set; }

    /// <summary>When the account gets deleted, or null when it isn't going to be.</summary>
    public DateTimeOffset? DeletionScheduledForUtc { get; private set; }

    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens;

    public IReadOnlyList<PasswordResetToken> PasswordResetTokens => _passwordResetTokens;

    public IReadOnlyList<EmailChangeToken> EmailChangeTokens => _emailChangeTokens;

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

    public void ChangeTheme(Theme theme)
    {
        Theme = theme;
    }

    public void ChangeColor(Color color)
    {
        Color = color;
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

    /// <summary>Whoever had the old password loses access: every device but this one is signed out.</summary>
    public void ChangePassword(string passwordHash, string keptRefreshTokenHash)
    {
        PasswordHash = passwordHash;
        _refreshTokens.RemoveAll(token => token.TokenHash != keptRefreshTokenHash);
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

    /// <summary>Only the newest reset link works: a new token cancels the older ones.</summary>
    public void AddPasswordResetToken(string tokenHash, DateTimeOffset expiresAtUtc)
    {
        _passwordResetTokens.Clear();
        _passwordResetTokens.Add(PasswordResetToken.Create(Id, tokenHash, expiresAtUtc));
    }

    public void RemovePasswordResetToken(PasswordResetToken passwordResetToken)
    {
        _passwordResetTokens.Remove(passwordResetToken);
    }

    /// <summary>Every device is signed out, and a waiting email change is cancelled. Needs the tokens loaded.</summary>
    public void ScheduleDeletion(DateTimeOffset nowUtc)
    {
        DeletionScheduledForUtc = nowUtc + DeletionWait;
        _refreshTokens.Clear();
        _emailChangeTokens.Clear();
    }

    public void CancelDeletion()
    {
        DeletionScheduledForUtc = null;
    }

    /// <summary>Only the newest link works: a new token cancels the older ones.</summary>
    public void AddEmailChangeToken(string newEmail, string tokenHash, DateTimeOffset expiresAtUtc)
    {
        _emailChangeTokens.Clear();
        _emailChangeTokens.Add(EmailChangeToken.Create(Id, NormalizeEmail(newEmail), tokenHash, expiresAtUtc));
    }

    public void RemoveEmailChangeToken(EmailChangeToken emailChangeToken)
    {
        _emailChangeTokens.Remove(emailChangeToken);
    }

    /// <summary>The address waiting for its link to be opened, or null. Needs the email change tokens loaded.</summary>
    public string? PendingEmail(DateTimeOffset nowUtc) =>
        _emailChangeTokens.SingleOrDefault(token => !token.IsExpired(nowUtc))?.NewEmail;

    /// <summary>The address is proven. A reset link sent to the old one stops working. Needs both kinds of token loaded.</summary>
    public void ChangeEmail(string newEmail)
    {
        Email = NormalizeEmail(newEmail);
        _emailChangeTokens.Clear();
        _passwordResetTokens.Clear();
    }

    /// <summary>Whoever had the old password loses access: the reset link stops working and every device is signed out.</summary>
    public void ResetPassword(string passwordHash)
    {
        PasswordHash = passwordHash;
        _passwordResetTokens.Clear();
        _refreshTokens.Clear();
    }
}
