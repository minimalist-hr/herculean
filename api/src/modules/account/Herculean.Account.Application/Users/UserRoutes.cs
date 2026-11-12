namespace Herculean.Account.Application.Users;

internal static class UserRoutes
{
    public const string Tag = "Users";

    public const string AdminTag = "Admin users";

    public const string AdminUsers = "/api/v1/admin/users";

    public const string Stats = AdminUsers + "/stats";

    public const string AdminUser = AdminUsers + "/{id:guid}";

    public const string AdminUserSessions = AdminUser + "/sessions/revoke";

    public const string AdminUserPasswordReset = AdminUser + "/password-reset";

    public const string AdminUserDeletion = AdminUser + "/deletion";

    public const string AdminUserPhoto = AdminUser + "/photo";

    public const string Users = "/api/v1/users";

    public const string Me = Users + "/me";

    public const string Password = Me + "/password";

    public const string Photo = Me + "/photo";

    public const string CreateRateLimit = "create-user";

    public const string ChangePasswordRateLimit = "change-password";

    public const string DeleteCurrentUserRateLimit = "delete-account";
}
