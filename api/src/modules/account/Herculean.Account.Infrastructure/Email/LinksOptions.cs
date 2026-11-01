using System.ComponentModel.DataAnnotations;

namespace Herculean.Account.Infrastructure.Email;

internal sealed class LinksOptions
{
    internal const string Section = "Links";

    /// <summary>The API's public address, for links in email.</summary>
    [Required]
    public string BaseUrl { get; init; } = string.Empty;

    /// <summary>What a link into the app starts with, up to the screen's name.</summary>
    [Required]
    public string AppUrl { get; init; } = string.Empty;
}
