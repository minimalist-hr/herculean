using Herculean.Account.Domain.Users;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class UserRepository(AccountDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByIdAsync(UserId userId, CancellationToken cancellationToken) =>
        dbContext.Users.SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        string normalizedEmail = User.NormalizeEmail(email);

        return dbContext.Users.SingleOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);
    }

    public Task<User?> GetByRefreshTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        dbContext.Users
            .Include(user => user.RefreshTokens.Where(token => token.TokenHash == tokenHash))
            .SingleOrDefaultAsync(user => user.RefreshTokens.Any(token => token.TokenHash == tokenHash), cancellationToken);

    public Task<User?> GetByEmailWithPasswordResetTokensAsync(string email, CancellationToken cancellationToken)
    {
        string normalizedEmail = User.NormalizeEmail(email);

        return dbContext.Users
            .Include(user => user.PasswordResetTokens)
            .SingleOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);
    }

    public Task<User?> GetByPasswordResetTokenHashAsync(string tokenHash, CancellationToken cancellationToken) =>
        dbContext.Users
            .Include(user => user.PasswordResetTokens)
            .Include(user => user.RefreshTokens)
            .AsSplitQuery()
            .SingleOrDefaultAsync(user => user.PasswordResetTokens.Any(token => token.TokenHash == tokenHash), cancellationToken);

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken)
    {
        string normalizedEmail = User.NormalizeEmail(email);

        return dbContext.Users.AnyAsync(user => user.Email == normalizedEmail, cancellationToken);
    }

    public void Add(User user)
    {
        dbContext.Users.Add(user);
    }
}
