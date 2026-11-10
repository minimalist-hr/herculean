using System.ComponentModel;

namespace Herculean.Account.Application.Users.ChangePassword;

[Description("The current and new passwords, and the refresh token of the device that stays signed in.")]
internal sealed record ChangePasswordRequest(
    [property: Description("The password the user has now.")] string CurrentPassword,
    [property: Description("The new password, 8 to 128 characters.")] string NewPassword,
    [property: Description("The refresh token this device holds now. Every other one is deleted.")] string RefreshToken);
