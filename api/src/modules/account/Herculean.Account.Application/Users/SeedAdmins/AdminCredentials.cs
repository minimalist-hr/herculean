namespace Herculean.Account.Application.Users.SeedAdmins;

/// <summary>An admin account from configuration: its email and its password.</summary>
internal sealed record AdminCredentials(string Email, string Password);
