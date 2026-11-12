using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Auth;

using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Herculean.Account.Infrastructure.Auth;

internal sealed class JwtTokenIssuer(IOptions<JwtOptions> options, TimeProvider timeProvider) : ITokenIssuer
{
    private const int RefreshTokenBytes = 32;

    private readonly JsonWebTokenHandler _tokenHandler = new() { SetDefaultTimesOnTokenCreation = false };

    public TokenResponse Issue(User user)
    {
        JwtOptions jwtOptions = options.Value;
        DateTime nowUtc = timeProvider.GetUtcNow().UtcDateTime;

        string accessToken = _tokenHandler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = jwtOptions.Issuer,
            Audience = jwtOptions.Audience,
            Claims = Claims(user),
            IssuedAt = nowUtc,
            NotBefore = nowUtc,
            Expires = nowUtc + jwtOptions.AccessTokenLifetime,
            SigningCredentials = new SigningCredentials(jwtOptions.CreateSigningKey(), JwtOptions.Algorithm),
        });

        string refreshToken = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(RefreshTokenBytes));
        user.AddRefreshToken(Hash(refreshToken), nowUtc + jwtOptions.RefreshTokenLifetime);
        user.MarkActive(nowUtc);

        return new TokenResponse(accessToken, (int)jwtOptions.AccessTokenLifetime.TotalSeconds, refreshToken);
    }

    public string HashRefreshToken(string refreshToken) => Hash(refreshToken);

    // Only an admin's token names a role, so a user's stays as it was.
    private static Dictionary<string, object> Claims(User user)
    {
        Dictionary<string, object> claims = new() { [JwtRegisteredClaimNames.Sub] = user.Id.Value.ToString() };
        if (user.IsAdmin)
        {
            claims[AuthorizationPolicies.RoleClaim] = AuthorizationPolicies.AdminRole;
        }

        return claims;
    }

    // The token is random and long, so a fast hash is enough. Only the hash is stored.
    internal static string Hash(string token) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
