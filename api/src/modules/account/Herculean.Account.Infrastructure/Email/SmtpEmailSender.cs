using Herculean.Account.Application.Email;
using Herculean.Account.Application.EmailChanges;
using Herculean.Account.Application.PasswordResets;

using MailKit.Net.Smtp;
using MailKit.Security;

using Microsoft.Extensions.Options;

using MimeKit;

namespace Herculean.Account.Infrastructure.Email;

internal sealed class SmtpEmailSender(IOptions<EmailOptions> options, IResetLinks resetLinks, IEmailChangeLinks emailChangeLinks) : IEmailSender
{
    public async Task SendAccountDeletedAsync(string email, DateTimeOffset deletedAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        using MimeMessage message = AccountDeletedEmail.Create(MailboxAddress.Parse(options.Value.From), email, deletedAtUtc, timeZone);

        await SendAsync(message, cancellationToken);
    }

    public async Task SendAccountDeletionScheduledAsync(string email, DateTimeOffset deleteAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        using MimeMessage message = AccountDeletionScheduledEmail.Create(MailboxAddress.Parse(options.Value.From), email, deleteAtUtc, timeZone);

        await SendAsync(message, cancellationToken);
    }

    public async Task SendAccountClosedAsync(string email, DateTimeOffset deleteAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        using MimeMessage message = AccountClosedEmail.Create(MailboxAddress.Parse(options.Value.From), email, deleteAtUtc, timeZone);

        await SendAsync(message, cancellationToken);
    }

    public async Task SendProfilePhotoRemovedAsync(string email, CancellationToken cancellationToken)
    {
        using MimeMessage message = ProfilePhotoRemovedEmail.Create(MailboxAddress.Parse(options.Value.From), email);

        await SendAsync(message, cancellationToken);
    }

    public async Task SendEmailChangeAsync(string newEmail, string token, CancellationToken cancellationToken)
    {
        using MimeMessage message = EmailChangeLinkEmail.Create(MailboxAddress.Parse(options.Value.From), newEmail, emailChangeLinks.Page(token));

        await SendAsync(message, cancellationToken);
    }

    public async Task SendEmailChangedAsync(string oldEmail, DateTimeOffset changedAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        using MimeMessage message = EmailChangedEmail.Create(MailboxAddress.Parse(options.Value.From), oldEmail, changedAtUtc, timeZone);

        await SendAsync(message, cancellationToken);
    }

    public async Task SendPasswordResetAsync(string email, string token, CancellationToken cancellationToken)
    {
        using MimeMessage message = PasswordResetEmail.Create(MailboxAddress.Parse(options.Value.From), email, resetLinks.Page(token));

        await SendAsync(message, cancellationToken);
    }

    public async Task SendPasswordChangedAsync(string email, DateTimeOffset changedAtUtc, string timeZone, CancellationToken cancellationToken)
    {
        using MimeMessage message = PasswordChangedEmail.Create(MailboxAddress.Parse(options.Value.From), email, changedAtUtc, timeZone);

        await SendAsync(message, cancellationToken);
    }

    private async Task SendAsync(MimeMessage message, CancellationToken cancellationToken)
    {
        EmailOptions emailOptions = options.Value;
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
