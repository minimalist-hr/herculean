using System.ComponentModel;

namespace Herculean.Account.Application.Users.CreateUser;

[Description("A new account.")]
internal sealed record CreateUserRequest(
    [property: Description("Unique regardless of case. At most 254 characters.")] string Email,
    [property: Description("8 to 128 characters.")] string Password,
    [property: Description("The phone's IANA time zone, for example Europe/Zagreb.")] string TimeZone);
