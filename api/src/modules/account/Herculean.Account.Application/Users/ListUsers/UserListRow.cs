namespace Herculean.Account.Application.Users.ListUsers;

/// <summary>A user, not an admin, as the admin list shows them.</summary>
internal sealed record UserListRow(
    Guid Id,
    string? Name,
    string Email,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? LastActiveUtc,
    DateTimeOffset? DeletionScheduledForUtc,
    bool IsClosed,
    bool HasPhoto);
