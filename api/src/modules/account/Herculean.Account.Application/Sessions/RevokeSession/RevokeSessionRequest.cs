using System.ComponentModel;

namespace Herculean.Account.Application.Sessions.RevokeSession;

[Description("The refresh token of the device signing out.")]
internal sealed record RevokeSessionRequest(
    [property: Description("The refresh token this device holds now.")] string RefreshToken);
