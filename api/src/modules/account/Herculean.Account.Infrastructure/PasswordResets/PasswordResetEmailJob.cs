using Herculean.Account.Application.PasswordResets.SendPasswordResetEmail;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Herculean.Account.Infrastructure.PasswordResets;

internal sealed partial class PasswordResetEmailJob(
    PasswordResetQueue passwordResetQueue,
    IServiceScopeFactory scopeFactory,
    ILogger<PasswordResetEmailJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (string email in passwordResetQueue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<SendPasswordResetEmailHandler>().HandleAsync(email, stoppingToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                // Only the type: the exception's message can hold the address, and emails are never logged.
                LogSendFailed(logger, exception.GetType().Name);
            }
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "A password reset email could not be sent: {ExceptionType}.")]
    private static partial void LogSendFailed(ILogger logger, string exceptionType);
}
