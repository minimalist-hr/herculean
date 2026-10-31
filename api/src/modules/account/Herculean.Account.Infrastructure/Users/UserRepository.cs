using Herculean.Account.Domain.Users;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class UserRepository(AccountDbContext dbContext) : IUserRepository
{
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
