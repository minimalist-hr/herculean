using System.Threading.Channels;

using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Email;
using Herculean.Account.Application.EmailChanges;
using Herculean.Account.Application.PasswordResets;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Auth;

namespace Herculean.Account.UnitTests.Application;

internal sealed class FakeCurrentUserAccessor : ICurrentUserAccessor
{
    public Guid UserId { get; set; } = Guid.CreateVersion7();
}

internal sealed class FakeUserRepository : IUserRepository
{
    public List<User> Users { get; } = [];

    public Task<User?> GetByIdAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Id == userId));

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Email == User.NormalizeEmail(email)));

    public Task<User?> GetByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.RefreshTokens.Any(token => token.TokenHash == tokenHash)));

    public Task<User?> GetByEmailWithPasswordResetTokensAsync(string email, CancellationToken cancellationToken) =>
        GetByEmailAsync(email, cancellationToken);

    public Task<User?> GetByIdWithRefreshTokensAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Id == userId));

    public Task<User?> GetByIdWithAllTokensAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Id == userId));

    public void Remove(User user)
    {
        Users.Remove(user);
    }

    public Task<User?> GetByIdWithEmailChangeTokensAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.Id == userId));

    public Task<User?> GetByEmailChangeTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.EmailChangeTokens.Any(token => token.TokenHash == tokenHash)));

    public Task<User?> GetByPasswordResetTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        Task.FromResult(Users.SingleOrDefault(user => user.PasswordResetTokens.Any(token => token.TokenHash == tokenHash)));

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken) =>
        Task.FromResult(Users.Any(user => user.Email == User.NormalizeEmail(email)));

    public void Add(User user)
    {
        Users.Add(user);
    }
}

internal sealed class FakeUnitOfWork : IUnitOfWork
{
    public bool Saved { get; private set; }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        Saved = true;

        return Task.CompletedTask;
    }
}

internal sealed class FakeOutbox : IOutbox
{
    public List<object> Events { get; } = [];

    public void Add<TEvent>(TEvent @event)
        where TEvent : class
    {
        Events.Add(@event);
    }
}

internal sealed class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => $"hashed:{password}";

    // A hash made with older settings starts with "old:".
    public PasswordVerification Verify(string? passwordHash, string password) =>
        passwordHash == Hash(password) ? PasswordVerification.Success
        : passwordHash == $"old:{password}" ? PasswordVerification.SuccessRehashNeeded
        : PasswordVerification.Failed;
}

internal sealed class FakeTokenIssuer : ITokenIssuer
{
    public static readonly TokenResponse TokenResponse = new("access", 900, "refresh");

    public TokenResponse Issue(User user)
    {
        user.AddRefreshToken("refresh-hash", DateTimeOffset.UnixEpoch);

        return TokenResponse;
    }

    public string HashRefreshToken(string refreshToken) => $"hash:{refreshToken}";
}

internal sealed class FakeEmailChangeTokenIssuer(DateTimeOffset expiresAtUtc) : IEmailChangeTokenIssuer
{
    public string Issue(User user, string newEmail)
    {
        user.AddEmailChangeToken(newEmail, Hash("token"), expiresAtUtc);

        return "token";
    }

    public string Hash(string token) => $"hash:{token}";
}

internal sealed class FakePasswordResetTokenIssuer : IPasswordResetTokenIssuer
{
    public const string Token = "reset-token";

    public string Issue(User user)
    {
        user.AddPasswordResetToken(Hash(Token), DateTimeOffset.UnixEpoch);

        return Token;
    }

    public string Hash(string token) => $"hash:{token}";
}

internal sealed class FakePasswordResetQueue : IPasswordResetQueue
{
    public List<string> Emails { get; } = [];

    public void Enqueue(string email)
    {
        Emails.Add(email);
    }
}

internal sealed class FakeResetLinks : IResetLinks
{
    public const string ExpiredLink = "expired";

    public string Page(string token) => $"page:{token}";

    public string NewPassword(string token, string email) => $"new-password:{token}:{email}";

    public string Expired() => ExpiredLink;
}

internal sealed class FakeEmailChangeLinks : IEmailChangeLinks
{
    public string Page(string token) => $"https://api.example.com/links/confirm-email?token={token}";

    public string Confirm(string token) => $"herculean://confirm-email?token={token}";
}

internal sealed record SentEmail(string Email, string Token);

internal sealed record SentPasswordChangedEmail(string Email, DateTimeOffset ChangedAtUtc, string TimeZone);

internal sealed class FakeEmailSender : IEmailSender
{
    private readonly Channel<SentEmail> _sent = Channel.CreateUnbounded<SentEmail>();

    public ChannelReader<SentEmail> Sent => _sent.Reader;

    public List<SentPasswordChangedEmail> PasswordChangedEmails { get; } = [];

    public bool FailNext { get; set; }

    public List<SentPasswordChangedEmail> AccountDeletedEmails { get; } = [];

    public Task SendAccountDeletedAsync(string email, DateTimeOffset deletedAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        AccountDeletedEmails.Add(new SentPasswordChangedEmail(email, deletedAtUtc, timeZone));

        return Task.CompletedTask;
    }

    public List<SentEmail> EmailChangeLinks { get; } = [];

    public List<SentPasswordChangedEmail> EmailChangedEmails { get; } = [];

    public Task SendEmailChangeAsync(string newEmail, string token, CancellationToken cancellationToken)
    {
        EmailChangeLinks.Add(new SentEmail(newEmail, token));

        return Task.CompletedTask;
    }

    public Task SendEmailChangedAsync(string oldEmail, DateTimeOffset changedAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        EmailChangedEmails.Add(new SentPasswordChangedEmail(oldEmail, changedAtUtc, timeZone));

        return Task.CompletedTask;
    }

    public Task SendPasswordChangedAsync(string email, DateTimeOffset changedAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        PasswordChangedEmails.Add(new SentPasswordChangedEmail(email, changedAtUtc, timeZone));

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken)
    {
        if (FailNext)
        {
            FailNext = false;
            throw new InvalidOperationException("The email could not be sent.");
        }

        _sent.Writer.TryWrite(new SentEmail(email, token));

        return Task.CompletedTask;
    }
}
