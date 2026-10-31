using System.ComponentModel.DataAnnotations;
using System.Text;

using Microsoft.IdentityModel.Tokens;

namespace Herculean.Account.Infrastructure.Auth;

internal sealed class JwtOptions
{
    internal const string Section = "Jwt";
    internal const string Algorithm = SecurityAlgorithms.HmacSha256;

    [Required]
    public string Issuer { get; init; } = string.Empty;

    [Required]
    public string Audience { get; init; } = string.Empty;

    // HMAC-SHA256 needs a key of at least 256 bits.
    [Required]
    [MinLength(32)]
    public string SigningKey { get; init; } = string.Empty;

    [Range(typeof(TimeSpan), "00:00:01", "1.00:00:00")]
    public TimeSpan AccessTokenLifetime { get; init; }

    [Range(typeof(TimeSpan), "00:00:01", "365.00:00:00")]
    public TimeSpan RefreshTokenLifetime { get; init; }

    // The same key signs access tokens and checks them.
    internal SymmetricSecurityKey CreateSigningKey() => new(Encoding.UTF8.GetBytes(SigningKey));
}
