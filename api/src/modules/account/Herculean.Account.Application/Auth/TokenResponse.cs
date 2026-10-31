using System.ComponentModel;

namespace Herculean.Account.Application.Auth;

[Description("The OAuth 2.0 token response (RFC 6749), in camelCase.")]
internal sealed record TokenResponse(
    [property: Description("A JWT. Send it as `Authorization: Bearer <accessToken>`.")] string AccessToken,
    [property: Description("Seconds until the access token expires.")] int ExpiresIn,
    [property: Description("Gets new tokens when the access token expires. Keep it in secure storage.")] string RefreshToken);
