using Herculean.SharedKernel.Results;

namespace Herculean.Account.Domain.Users;

internal static class UserErrors
{
    public static readonly Error EmailTaken = Error.Conflict("user.email_taken", "An account with this email already exists.");
}
