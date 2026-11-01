namespace Herculean.Account.Application.Email;

internal interface IEmailSender
{
    Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken);
}
