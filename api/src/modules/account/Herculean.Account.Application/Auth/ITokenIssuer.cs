using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Auth;

internal interface ITokenIssuer
{
    /// <summary>Creates an access token and a refresh token, and adds the refresh token to the user.</summary>
    TokenResponse Issue(User user);
}
