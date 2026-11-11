using Herculean.Account.Application.Users.GetUserStats;
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

    /// <summary>The name and email of each user that exists, of those asked for.</summary>
    Task<IReadOnlyList<UserContact>> ListContactsAsync(IReadOnlyCollection<UserId> ids, CancellationToken cancellationToken);
}
