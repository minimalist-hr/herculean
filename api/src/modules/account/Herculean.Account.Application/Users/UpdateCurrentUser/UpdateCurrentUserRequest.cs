using System.ComponentModel;

using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users.UpdateCurrentUser;

[Description("The fields to change. A field left out, or null, stays the same.")]
internal sealed record UpdateCurrentUserRequest(
    [property: Description("1 to 50 characters, trimmed.")] string? Name = null,
    [property: Description("The units the app shows weights and lengths in.")] Units? Units = null,
    [property: Description("The app's look.")] Theme? Theme = null,
    [property: Description("The phone's IANA time zone, for example Europe/Zagreb. Sent when the phone's changes.")] string? TimeZone = null);
