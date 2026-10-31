namespace Herculean.Account.Domain.Users;

internal interface IUserRepository
{
    /// <summary>Checks the email regardless of case.</summary>
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);

    void Add(User user);
}
