using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Auth;

internal interface IEmailChangeTokenIssuer
{
    /// <summary>Creates a token, adds its hash to the user and returns the token for the link.</summary>
    string Issue(User user, string newEmail);

    /// <summary>The hash a token is stored as, to find it again.</summary>
    string Hash(string token);
}
