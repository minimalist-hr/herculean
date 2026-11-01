namespace Herculean.Account.Application.PasswordResets;

internal static class PasswordResetRoutes
{
    public const string Tag = "Password resets";

    public const string PasswordResets = "/api/v1/password-resets";

    public const string Complete = PasswordResets + "/complete";

    public const string ResetLink = "/links/reset-password";

    public const string CreateRateLimit = "password-reset";

    public const string CompleteRateLimit = "password-reset-complete";
}
