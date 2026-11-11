using Herculean.Account.Application.Users.DeleteDueAccounts;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Herculean.Account.Infrastructure.Users;

/// <summary>Once at start and then daily, deletes the accounts whose wait is over.</summary>
internal sealed partial class AccountDeletionJob(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    DeletionJobRuns runs,
    ILogger<AccountDeletionJob> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromDays(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using PeriodicTimer timer = new(Interval, timeProvider);

        do
        {
            try
            {
                await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<DeleteDueAccountsHandler>().HandleAsync(stoppingToken);
                runs.Ran(timeProvider.GetUtcNow(), failed: false);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                // Only the type: the exception's message can hold an address, and emails are never logged.
                LogDeleteFailed(logger, exception.GetType().Name);
                runs.Ran(timeProvider.GetUtcNow(), failed: true);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Accounts due for deletion could not be deleted: {ExceptionType}.")]
    private static partial void LogDeleteFailed(ILogger logger, string exceptionType);
}
