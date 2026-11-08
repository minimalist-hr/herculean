using System.ComponentModel.DataAnnotations;

namespace Herculean.Account.Infrastructure.Auth;

internal sealed class TokensOptions
{
    internal const string Section = "Tokens";

    [Range(typeof(TimeSpan), "00:00:01", "1.00:00:00")]
    public TimeSpan ResetLinkLifetime { get; init; }

    [Range(typeof(TimeSpan), "00:00:01", "7.00:00:00")]
    public TimeSpan EmailChangeLifetime { get; init; }
}
