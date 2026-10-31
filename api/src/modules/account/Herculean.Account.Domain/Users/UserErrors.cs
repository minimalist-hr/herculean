using Herculean.SharedKernel.Results;

namespace Herculean.Account.Domain.Users;

internal static class UserErrors
{
    public static readonly Error EmailTaken = Error.Conflict("user.email_taken", "An account with this email already exists.");

    // The access token is still valid, but the account it names is gone.
    public static readonly Error NotFound = Error.NotFound("user.not_found", "The account does not exist.");
}
