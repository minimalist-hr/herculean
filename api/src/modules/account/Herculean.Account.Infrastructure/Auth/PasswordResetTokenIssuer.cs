using System.Buffers.Text;
using System.Security.Cryptography;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;

using Microsoft.Extensions.Options;

namespace Herculean.Account.Infrastructure.Auth;

internal sealed class PasswordResetTokenIssuer(IOptions<TokensOptions> options, TimeProvider timeProvider) : IPasswordResetTokenIssuer
{
    private const int TokenBytes = 32;

    public string Issue(User user)
    {
        string token = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(TokenBytes));
        user.AddPasswordResetToken(Hash(token), timeProvider.GetUtcNow() + options.Value.ResetLinkLifetime);

        return token;
    }

    public string Hash(string token) => JwtTokenIssuer.Hash(token);
}
