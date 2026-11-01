using Herculean.Account.Application.Email;
using Herculean.Account.Application.PasswordResets;

using MailKit.Net.Smtp;
using MailKit.Security;

using Microsoft.Extensions.Options;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal sealed class SmtpEmailSender(IOptions<EmailOptions> options, IResetLinks resetLinks) : IEmailSender
{
    public async Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken)
    {
        EmailOptions emailOptions = options.Value;
        using MimeMessage message = PasswordResetEmail.Create(MailboxAddress.Parse(emailOptions.From), email, resetLinks.Page(token));

        using SmtpClient client = new();

        // Auto uses TLS from the start on port 465, and otherwise when the server offers it.
        await client.ConnectAsync(emailOptions.Host, emailOptions.Port, SecureSocketOptions.Auto, cancellationToken);
        if (emailOptions.Password.Length > 0)
        {
            await client.AuthenticateAsync(emailOptions.Username, emailOptions.Password, cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(quit: true, cancellationToken);
    }
}
