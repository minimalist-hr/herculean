using System.ComponentModel;

namespace Herculean.Account.Application.Users.GetUser;

[Description("A user's account, as an admin sees it. Never what they logged.")]
internal sealed record AdminUserResponse(
    [property: Description("The user's ID.")] Guid Id,
    [property: Description("Their name, or null before setup.")] string? Name,
    [property: Description("Their email.")] string Email,
    [property: Description("When they created their account.")] DateTimeOffset CreatedAtUtc,
    [property: Description("The last time their app signed in or renewed its sign in, or null if it never has.")] DateTimeOffset? LastActiveAtUtc,
    [property: Description("When the account gets deleted, or null when it isn't going to be.")] DateTimeOffset? DeletionScheduledForUtc,
    [property: Description("Whether Minimalist closed it for breaking the terms.")] bool Closed,
    [property: Description("Whether they have a profile photo.")] bool HasPhoto);
