using System.Buffers.Text;
using System.Security.Cryptography;

using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;

using Microsoft.Extensions.Options;

namespace Herculean.Account.Infrastructure.Auth;

internal sealed class EmailChangeTokenIssuer(IOptions<TokensOptions> options, TimeProvider timeProvider) : IEmailChangeTokenIssuer
{
    private const int TokenBytes = 32;

    public string Issue(User user, string newEmail)
    {
        string token = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(TokenBytes));
        user.AddEmailChangeToken(newEmail, Hash(token), timeProvider.GetUtcNow() + options.Value.EmailChangeLifetime);

        return token;
    }

    public string Hash(string token) => JwtTokenIssuer.Hash(token);
}
