using Herculean.SharedKernel.Entities;

namespace Herculean.Account.Domain.Users;

internal sealed class User : Entity<UserId>
{
    internal const int NameMaxLength = 50;

    /// <summary>Admins don't train, so they need no setup or time zone of their own.</summary>
    internal const string AdminTimeZone = "Etc/UTC";

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

    public Role Role { get; private set; } = Role.User;

    public bool IsAdmin => Role == Role.Admin;

    /// <summary>Empty until setup.</summary>
    public string? Name { get; private set; }

    public Units Units { get; private set; } = Units.Metric;

    public Theme Theme { get; private set; } = Theme.Default;

    /// <summary>An IANA name, for example <c>Europe/Zagreb</c>.</summary>
    public string TimeZone { get; private set; }

    /// <summary>When the account gets deleted, or null when it isn't going to be.</summary>
    public DateTimeOffset? DeletionScheduledForUtc { get; private set; }

    /// <summary>Minimalist closed it for breaking the terms, so it can't sign in until the deletion is cancelled.</summary>
    public bool IsClosed { get; private set; }

    /// <summary>The last time the app signed in or renewed its sign in, or null before the first.</summary>
    public DateTimeOffset? LastActiveUtc { get; private set; }

    /// <summary>Null when there is none, or when it wasn't loaded.</summary>
    public UserPhoto? Photo { get; private set; }

    public IReadOnlyList<RefreshToken> RefreshTokens => _refreshTokens;

    public IReadOnlyList<PasswordResetToken> PasswordResetTokens => _passwordResetTokens;

    public IReadOnlyList<EmailChangeToken> EmailChangeTokens => _emailChangeTokens;

    public static User Create(string email, string passwordHash, string timeZone) =>
        new(UserId.New(), NormalizeEmail(email), passwordHash, timeZone);

    /// <summary>One of Minimalist's own accounts, from configuration, with the password set there.</summary>
    public static User CreateAdmin(string email, string passwordHash) =>
        new(UserId.New(), NormalizeEmail(email), passwordHash, AdminTimeZone) { Role = Role.Admin };

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

    public void MarkActive(DateTimeOffset nowUtc)
    {
        LastActiveUtc = nowUtc;
    }

    public void AddRefreshToken(string tokenHash, DateTimeOffset expiresAtUtc)
    {
        _refreshTokens.Add(RefreshToken.Create(Id, tokenHash, expiresAtUtc));
    }

    /// <summary>Removes a token that can no longer be used.</summary>
    public void RemoveRefreshToken(RefreshToken refreshToken)
    {
        _refreshTokens.Remove(refreshToken);
    }

    /// <summary>A replaced token works for a short while, in case the answer with the new one was lost. Tokens past that go now.</summary>
    public void ReplaceRefreshToken(RefreshToken refreshToken, DateTimeOffset nowUtc)
    {
        refreshToken.MarkReplaced(nowUtc);
        _refreshTokens.RemoveAll(token => token.IsPastGracePeriod(nowUtc));
    }

    /// <summary>Signs out one device. Replaced tokens go too, so none can sign it back in.</summary>
    public void RevokeRefreshToken(RefreshToken refreshToken)
    {
        _refreshTokens.Remove(refreshToken);
        _refreshTokens.RemoveAll(token => token.ReplacedAtUtc is not null);
    }

    /// <summary>Signs out every device. Needs the refresh tokens loaded.</summary>
    public void SignOutEverywhere()
    {
        _refreshTokens.Clear();
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

    /// <summary>Needs the photo loaded.</summary>
    public void SetPhoto(byte[] image)
    {
        if (Photo is null)
        {
            Photo = UserPhoto.Create(Id, image);
        }
        else
        {
            Photo.Replace(image);
        }
    }

    /// <summary>Needs the photo loaded.</summary>
    public void RemovePhoto()
    {
        Photo = null;
    }

    /// <summary>Every device is signed out, and a waiting email change is cancelled. Needs the tokens loaded.</summary>
    public void ScheduleDeletion(DateTimeOffset nowUtc)
    {
        DeletionScheduledForUtc = nowUtc + DeletionWait;
        _refreshTokens.Clear();
        _emailChangeTokens.Clear();
    }

    /// <summary>Like <see cref="ScheduleDeletion"/>, but not the user's choice: it can't sign in or be kept. Needs the tokens loaded.</summary>
    public void Close(DateTimeOffset nowUtc)
    {
        ScheduleDeletion(nowUtc);
        IsClosed = true;
    }

    /// <summary>The account stays, and a closed one opens again.</summary>
    public void CancelDeletion()
    {
        DeletionScheduledForUtc = null;
        IsClosed = false;
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
