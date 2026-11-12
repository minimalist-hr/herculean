using System.ComponentModel;

namespace Herculean.Account.Application.Users.ListUsers;

[Description("A page of users. Admins aren't listed.")]
internal sealed record UsersPageResponse(
    [property: Description("The users on this page.")] List<UserListItemResponse> Users,
    [property: Description("Pass it as cursor for the next page. Null on the last page.")] string? NextCursor);

[Description("A user in the list.")]
internal sealed record UserListItemResponse(
    [property: Description("The user's ID.")] Guid Id,
    [property: Description("Their name, or null before setup.")] string? Name,
    [property: Description("Their email.")] string Email,
    [property: Description("The last time their app signed in or renewed its sign in, or null if it never has.")] DateTimeOffset? LastActiveAtUtc,
    [property: Description("When the account gets deleted, or null when it isn't going to be.")] DateTimeOffset? DeletionScheduledForUtc,
    [property: Description("Whether Minimalist closed it for breaking the terms.")] bool Closed,
    [property: Description("Whether they have a profile photo.")] bool HasPhoto);
