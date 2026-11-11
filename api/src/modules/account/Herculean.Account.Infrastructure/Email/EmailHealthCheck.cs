using MailKit.Net.Smtp;
using MailKit.Security;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace Herculean.Account.Infrastructure.Email;

/// <summary>Connects to the email server, and sends nothing.</summary>
internal sealed class EmailHealthCheck(IOptions<EmailOptions> options) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        EmailOptions emailOptions = options.Value;
        try
        {
            using SmtpClient client = new();
            await client.ConnectAsync(emailOptions.Host, emailOptions.Port, SecureSocketOptions.Auto, cancellationToken);
            await client.DisconnectAsync(quit: true, cancellationToken);

            return HealthCheckResult.Healthy($"Reached {emailOptions.Host}.");
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy($"Couldn’t reach {emailOptions.Host}.");
        }
    }
}
