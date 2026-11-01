using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.PasswordResets.OpenResetLink;

internal sealed class OpenResetLinkHandler(
    IUserRepository userRepository,
    IPasswordResetTokenIssuer passwordResetTokenIssuer,
    IResetLinks resetLinks,
    TimeProvider timeProvider)
{
    /// <summary>Finds where the link leads in the app. Opening it changes nothing, because email apps open links to check them.</summary>
    public async Task<string> HandleAsync(string? token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(token))
        {
            return resetLinks.Expired();
        }

        string tokenHash = passwordResetTokenIssuer.Hash(token);
        User? user = await userRepository.GetByPasswordResetTokenHashAsync(tokenHash, cancellationToken);
        PasswordResetToken? passwordResetToken = user?.PasswordResetTokens.SingleOrDefault(resetToken => resetToken.TokenHash == tokenHash);

        return user is null || passwordResetToken is null || passwordResetToken.IsExpired(timeProvider.GetUtcNow())
            ? resetLinks.Expired()
            : resetLinks.NewPassword(token, user.Email);
    }
}
