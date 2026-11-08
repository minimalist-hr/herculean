using Herculean.SharedKernel.Results;

namespace Herculean.Account.Domain.Users;

internal static class UserErrors
{
    public static readonly Error EmailTaken = Error.Conflict("user.email_taken", "An account with this email already exists.");

    // The access token is still valid, but the account it names is gone.
    public static readonly Error NotFound = Error.NotFound("user.not_found", "The account does not exist.");

    // One message for both, so sign in never tells which emails have an account.
    public static readonly Error InvalidCredentials = Error.Unauthorized("user.invalid_credentials", "Email or password is wrong.");

    // Not a 401: that would mean the access token expired.
    public static readonly Error WrongCurrentPassword = Error.Validation(new Dictionary<string, string[]>
    {
        ["currentPassword"] = ["The current password is wrong."],
    });

    public static readonly Error InvalidRefreshToken = Error.Unauthorized("user.invalid_refresh_token", "The refresh token is unknown, used or expired. Sign in again.");

    public static readonly Error InvalidPasswordResetToken = Error.NotFound("user.invalid_password_reset_token", "This link has expired. Send a new one.");
}
