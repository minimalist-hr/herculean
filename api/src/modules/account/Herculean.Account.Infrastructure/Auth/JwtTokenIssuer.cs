using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;

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
            Claims = new Dictionary<string, object> { [JwtRegisteredClaimNames.Sub] = user.Id.Value.ToString() },
            IssuedAt = nowUtc,
            NotBefore = nowUtc,
            Expires = nowUtc + jwtOptions.AccessTokenLifetime,
            SigningCredentials = new SigningCredentials(jwtOptions.CreateSigningKey(), JwtOptions.Algorithm),
        });

        string refreshToken = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(RefreshTokenBytes));
        user.AddRefreshToken(Hash(refreshToken), nowUtc + jwtOptions.RefreshTokenLifetime);

        return new TokenResponse(accessToken, (int)jwtOptions.AccessTokenLifetime.TotalSeconds, refreshToken);
    }

    // The token is random and long, so a fast hash is enough. Only the hash is stored.
    internal static string Hash(string token) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
