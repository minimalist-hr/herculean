using Herculean.Account.Application.Users.GetUserStats;
using Herculean.Account.Contracts;
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

    public Task<DateTimeOffset> GetCreatedAtUtcAsync(UserId id, CancellationToken cancellationToken) =>
        dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == id)
            .Select(user => user.CreatedAtUtc)
            .SingleAsync(cancellationToken);

    public async Task<UserCounts> CountUsersAsync(DateTimeOffset since, CancellationToken cancellationToken)
    {
        IQueryable<User> users = dbContext.Users.AsNoTracking().Where(user => user.Role == Role.User);

        return new UserCounts(
            await users.CountAsync(cancellationToken),
            await users.CountAsync(user => user.DeletionScheduledForUtc != null, cancellationToken),
            await users.Where(user => user.CreatedAtUtc >= since).Select(user => user.CreatedAtUtc).ToListAsync(cancellationToken));
    }

    public async Task<IReadOnlyList<UserContact>> ListContactsAsync(IReadOnlyCollection<UserId> ids, CancellationToken cancellationToken) =>
        await dbContext.Users
            .AsNoTracking()
            .Where(user => ids.Contains(user.Id))
            .Select(user => new UserContact(user.Id.Value, user.Name, user.Email))
            .ToListAsync(cancellationToken);
}
