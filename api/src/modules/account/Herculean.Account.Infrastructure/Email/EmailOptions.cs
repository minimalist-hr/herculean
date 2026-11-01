using System.ComponentModel.DataAnnotations;

namespace Herculean.Account.Infrastructure.Email;

internal sealed class EmailOptions
{
    internal const string Section = "Email";

    [Required]
    public string Host { get; init; } = string.Empty;

    [Range(1, 65535)]
    public int Port { get; init; }

    [Required]
    public string From { get; init; } = string.Empty;

    public string Username { get; init; } = string.Empty;

    /// <summary>Empty locally: Mailpit takes email without signing in.</summary>
    public string Password { get; init; } = string.Empty;
}
