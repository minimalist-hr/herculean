using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users;

internal interface IUserReadRepository
{
    /// <summary>The IANA time zone of a user who exists.</summary>
    Task<string> GetTimeZoneAsync(UserId id, CancellationToken cancellationToken);

    /// <summary>When a user who exists created their account.</summary>
    Task<DateTimeOffset> GetCreatedAtUtcAsync(UserId id, CancellationToken cancellationToken);
}
