using System.ComponentModel;

namespace Herculean.Account.Application.PasswordResets.CompletePasswordReset;

[Description("The token from the reset link, and the new password.")]
internal sealed record CompletePasswordResetRequest(
    [property: Description("The token from the reset link. It works once.")] string Token,
    [property: Description("The new password, 8 to 128 characters.")] string Password);
