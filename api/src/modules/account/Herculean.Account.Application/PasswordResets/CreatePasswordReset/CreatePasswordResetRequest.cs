using System.ComponentModel;

namespace Herculean.Account.Application.PasswordResets.CreatePasswordReset;

[Description("Where to send the password reset link.")]
internal sealed record CreatePasswordResetRequest(
    [property: Description("The account's email. Not case-sensitive.")] string Email);
