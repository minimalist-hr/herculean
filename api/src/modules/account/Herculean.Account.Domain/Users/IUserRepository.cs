namespace Herculean.Account.Domain.Users;

internal interface IUserRepository
{
    Task<User?> GetByIdAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>Checks the email regardless of case.</summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);

    void Add(User user);
}
