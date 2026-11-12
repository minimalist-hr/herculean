using Herculean.Account.Application.Users.GetUser;
using Herculean.Account.Application.Users.GetUserStats;
using Herculean.Account.Application.Users.ListUsers;
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

    public async Task<List<UserListRow>> ListUsersAsync(string? search, bool deletingSoon, DateTimeOffset? after, int take, CancellationToken cancellationToken)
    {
        IQueryable<User> users = dbContext.Users.AsNoTracking().Where(user => user.Role == Role.User);

        if (search is not null)
        {
            // ILIKE is PostgreSQL's, so this part isn't covered by the in-memory tests.
            string pattern = $"%{EscapeLike(search)}%";
            users = users.Where(user => EF.Functions.ILike(user.Email, pattern) || (user.Name != null && EF.Functions.ILike(user.Name, pattern)));
        }

        if (deletingSoon)
        {
            users = users.Where(user => user.DeletionScheduledForUtc != null);
            if (after is not null)
            {
                users = users.Where(user => user.DeletionScheduledForUtc > after);
            }

            users = users.OrderBy(user => user.DeletionScheduledForUtc);
        }
        else
        {
            if (after is not null)
            {
                users = users.Where(user => user.CreatedAtUtc < after);
            }

            users = users.OrderByDescending(user => user.CreatedAtUtc);
        }

        return await users
            .Take(take)
            .Select(user => new UserListRow(user.Id.Value, user.Name, user.Email, user.CreatedAtUtc, user.LastActiveUtc, user.DeletionScheduledForUtc, user.IsClosed, user.Photo != null))
            .ToListAsync(cancellationToken);
    }

    // A search for "50%" looks for those characters, not any text.
    private static string EscapeLike(string text) =>
        text.Replace(@"\", @"\\", StringComparison.Ordinal).Replace("%", @"\%", StringComparison.Ordinal).Replace("_", @"\_", StringComparison.Ordinal);

    public Task<AdminUserResponse?> GetUserAsync(UserId id, CancellationToken cancellationToken) =>
        dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == id && user.Role == Role.User)
            .Select(user => new AdminUserResponse(user.Id.Value, user.Name, user.Email, user.CreatedAtUtc, user.LastActiveUtc, user.DeletionScheduledForUtc, user.IsClosed, user.Photo != null))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<UserContact>> ListContactsAsync(IReadOnlyCollection<UserId> ids, CancellationToken cancellationToken) =>
        await dbContext.Users
            .AsNoTracking()
            .Where(user => ids.Contains(user.Id))
            .Select(user => new UserContact(user.Id.Value, user.Name, user.Email))
            .ToListAsync(cancellationToken);
}
