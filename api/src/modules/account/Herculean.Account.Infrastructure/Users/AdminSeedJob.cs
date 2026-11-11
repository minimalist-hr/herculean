using Herculean.Account.Application.Users.SeedAdmins;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Herculean.Account.Infrastructure.Users;

/// <summary>Once at start, makes the admin accounts in configuration.</summary>
internal sealed partial class AdminSeedJob(
    IServiceScopeFactory scopeFactory,
    IOptions<AdminOptions> options,
    ILogger<AdminSeedJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<SeedAdminsHandler>().HandleAsync(
                options.Value.Accounts.Select(account => new AdminCredentials(account.Email, account.Password)),
                stoppingToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            // Only the type: the exception's message can hold an address, and emails are never logged.
            LogSeedFailed(logger, exception.GetType().Name);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "The admin accounts could not be made: {ExceptionType}.")]
    private static partial void LogSeedFailed(ILogger logger, string exceptionType);
}
