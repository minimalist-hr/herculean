using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.Users;

/// <summary>What admins can see and do with users. Admin accounts are never among them.</summary>
internal static class AdminUsers
{
    /// <summary>The user, or null when there is none or the account is an admin's.</summary>
    public static User? OnlyUser(User? user) => user is { IsAdmin: false } ? user : null;
}
