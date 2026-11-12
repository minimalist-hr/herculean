using System.ComponentModel;

using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users;

[Description("The signed-in user.")]
internal sealed record UserResponse(
    [property: Description("Lowercase. Unique regardless of case.")] string Email,
    [property: Description("Null until setup. The greeting uses its first word.")] string? Name,
    [property: Description("The units the app shows weights and lengths in.")] Units Units,
    [property: Description("The app's look.")] Theme Theme,
    [property: Description("The phone's IANA time zone, for example Europe/Zagreb. Dates and days use it.")] string TimeZone,
    [property: Description("What the account is for. An admin sees only the feedback inbox.")] Role Role)
{
    public static UserResponse From(User user) => new(user.Email, user.Name, user.Units, user.Theme, user.TimeZone, user.Role);
}
