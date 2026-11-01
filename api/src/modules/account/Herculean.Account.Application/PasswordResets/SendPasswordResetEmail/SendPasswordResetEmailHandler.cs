using Herculean.Account.Application.Auth;
using Herculean.Account.Application.Email;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;

namespace Herculean.Account.Application.PasswordResets.SendPasswordResetEmail;

internal sealed class SendPasswordResetEmailHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordResetTokenIssuer passwordResetTokenIssuer,
    IEmailSender emailSender)
{
    public async Task HandleAsync(string email, CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByEmailWithPasswordResetTokensAsync(email, cancellationToken);
        if (user is null)
        {
            return;
        }

        string token = passwordResetTokenIssuer.Issue(user);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await emailSender.SendPasswordResetAsync(user.Email, token, cancellationToken);
    }
}
