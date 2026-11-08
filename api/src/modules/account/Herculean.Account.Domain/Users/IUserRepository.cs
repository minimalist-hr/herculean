namespace Herculean.Account.Domain.Users;

internal interface IUserRepository
{
    Task<User?> GetByIdAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>Finds the user with all their refresh tokens loaded.</summary>
    Task<User?> GetByIdWithRefreshTokensAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>Finds the user with their photo loaded.</summary>
    Task<User?> GetByIdWithPhotoAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>Finds the user with every kind of token loaded, so removing the user removes them.</summary>
    Task<User?> GetByIdWithAllTokensAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>Finds the user with their email change tokens loaded.</summary>
    Task<User?> GetByIdWithEmailChangeTokensAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>Finds the user who holds the email change token, with their email change and password reset tokens loaded.</summary>
    Task<User?> GetByEmailChangeTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    /// <summary>Finds the user regardless of the email's case.</summary>
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken);

    /// <summary>Finds the user who holds the refresh token, with only that token loaded.</summary>
    Task<User?> GetByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    /// <summary>Finds the user regardless of the email's case, with their password reset tokens loaded.</summary>
    Task<User?> GetByEmailWithPasswordResetTokensAsync(string email, CancellationToken cancellationToken);

    /// <summary>Finds the user who holds the password reset token, with their password reset and refresh tokens loaded.</summary>
    Task<User?> GetByPasswordResetTokenHashAsync(string tokenHash, CancellationToken cancellationToken);

    /// <summary>Checks the email regardless of case.</summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);

    /// <summary>The users whose time to keep their account is over, with their photo and every kind of token loaded.</summary>
    Task<IReadOnlyList<User>> ListDueForDeletionAsync(DateTimeOffset nowUtc, CancellationToken cancellationToken);

    void Add(User user);

    void Remove(User user);
}
