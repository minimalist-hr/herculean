namespace Herculean.Account.Application.Sessions;

internal static class SessionRoutes
{
    public const string Tag = "Sessions";

    public const string Sessions = "/api/v1/sessions";

    public const string Refresh = Sessions + "/refresh";

    public const string Revoke = Sessions + "/revoke";

    // Each has its own limit of tries per IP address, so failed sign ins never block the app refreshing.
    public const string SignInRateLimit = "sign-in";

    public const string RefreshRateLimit = "refresh";

    public const string RevokeRateLimit = "revoke";
}
