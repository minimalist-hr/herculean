using System.ComponentModel;

namespace Herculean.Account.Application.Sessions.RefreshSession;

[Description("The refresh token to swap for new tokens.")]
internal sealed record RefreshSessionRequest(
    [property: Description("The refreshToken from signing in, creating the account or the last refresh. It works once.")] string RefreshToken);
