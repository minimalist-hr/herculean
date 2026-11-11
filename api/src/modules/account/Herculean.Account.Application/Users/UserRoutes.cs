namespace Herculean.Account.Application.Users;

internal static class UserRoutes
{
    public const string Tag = "Users";

    public const string Stats = "/api/v1/admin/users/stats";

    public const string Users = "/api/v1/users";

    public const string Me = Users + "/me";

    public const string Password = Me + "/password";

    public const string Photo = Me + "/photo";

    public const string CreateRateLimit = "create-user";

    public const string ChangePasswordRateLimit = "change-password";

    public const string DeleteCurrentUserRateLimit = "delete-account";
}
