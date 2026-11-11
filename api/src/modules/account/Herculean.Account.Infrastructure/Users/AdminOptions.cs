namespace Herculean.Account.Infrastructure.Users;

/// <summary>Minimalist's own accounts, which only manage feedback. Secret: user secrets locally, secrets elsewhere.</summary>
internal sealed class AdminOptions
{
    public const string Section = "Admin";

    /// <summary>Each gets an admin account at startup if it has none, with its password. Empty means no admins.</summary>
    public AdminAccountOptions[] Accounts { get; init; } = [];
}

/// <summary>One admin account.</summary>
internal sealed class AdminAccountOptions
{
    public string Email { get; init; } = string.Empty;

    /// <summary>8 to 128 characters. Changing it here changes it on the next start.</summary>
    public string Password { get; init; } = string.Empty;
}
