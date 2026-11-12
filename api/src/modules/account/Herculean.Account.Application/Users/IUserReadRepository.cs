using Herculean.Account.Application.Users.GetUser;
using Herculean.Account.Application.Users.GetUserStats;
using Herculean.Account.Application.Users.ListUsers;
using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users;

internal interface IUserReadRepository
{
    /// <summary>The IANA time zone of a user who exists.</summary>
    Task<string> GetTimeZoneAsync(UserId id, CancellationToken cancellationToken);

    /// <summary>When a user who exists created their account.</summary>
    Task<DateTimeOffset> GetCreatedAtUtcAsync(UserId id, CancellationToken cancellationToken);

    /// <summary>Counts the users, not admins, and lists when those who signed up since <paramref name="since"/> did.</summary>
    Task<UserCounts> CountUsersAsync(DateTimeOffset since, CancellationToken cancellationToken);

    /// <summary>
    /// Users, not admins, whose name or email holds <paramref name="search"/> in any case, at most <paramref name="take"/>:
    /// the newest first, signed up before <paramref name="after"/>, or with <paramref name="deletingSoon"/>,
    /// those waiting for deletion, the soonest first, deleted after <paramref name="after"/>.
    /// </summary>
    Task<List<UserListRow>> ListUsersAsync(string? search, bool deletingSoon, DateTimeOffset? after, int take, CancellationToken cancellationToken);

    /// <summary>A user, not an admin, or null when there is none.</summary>
    Task<AdminUserResponse?> GetUserAsync(UserId id, CancellationToken cancellationToken);

    /// <summary>The name and email of each user that exists, of those asked for.</summary>
    Task<IReadOnlyList<UserContact>> ListContactsAsync(IReadOnlyCollection<UserId> ids, CancellationToken cancellationToken);
}
