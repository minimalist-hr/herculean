using System.ComponentModel;

namespace Herculean.Account.Application.Users.DeleteCurrentUser;

[Description("The password that proves it's the user asking.")]
internal sealed record DeleteCurrentUserRequest(
    [property: Description("The password the user has now.")] string CurrentPassword);
