using Herculean.Account.Application.Users;
using Herculean.Account.Domain.Users;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Account.Infrastructure.Users;

internal sealed class UserReadRepository(AccountDbContext dbContext) : IUserReadRepository
{
    public Task<string> GetTimeZoneAsync(UserId id, CancellationToken cancellationToken) =>
        dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == id)
            .Select(user => user.TimeZone)
            .SingleAsync(cancellationToken);
}
