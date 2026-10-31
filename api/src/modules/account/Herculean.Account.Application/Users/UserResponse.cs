using System.ComponentModel;

using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users;

[Description("The signed-in user.")]
internal sealed record UserResponse(
    [property: Description("Lowercase. Unique regardless of case.")] string Email,
    [property: Description("Null until setup. The greeting uses its first word.")] string? Name,
    [property: Description("The units the app shows weights and lengths in.")] Units Units,
    [property: Description("The phone's IANA time zone, for example Europe/Zagreb. Dates and days use it.")] string TimeZone)
{
    public static UserResponse From(User user) => new(user.Email, user.Name, user.Units, user.TimeZone);
}
