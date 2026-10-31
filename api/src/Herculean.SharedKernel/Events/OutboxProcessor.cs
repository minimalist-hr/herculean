using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Herculean.SharedKernel.Events;

internal sealed partial class OutboxProcessor<TContext>(
    IServiceScopeFactory scopeFactory,
    OutboxSignal<TContext> outboxSignal,
    IEnumerable<IntegrationEventSubscription> integrationEventSubscriptions,
    TimeProvider timeProvider,
    ILogger<OutboxProcessor<TContext>> logger) : BackgroundService
    where TContext : DbContext
{
    internal const int BatchSize = 20;
    internal const int MaxAttempts = 5;
    internal static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await outboxSignal.WaitAsync(CheckInterval, stoppingToken);

            try
            {
                await ProcessAsync(stoppingToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                // The database may be down for a moment. The next check tries again.
                LogBatchFailed(logger, exception);
            }
        }
    }

    internal async Task ProcessAsync(CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        TContext dbContext = scope.ServiceProvider.GetRequiredService<TContext>();

        List<OutboxMessage> messages = await dbContext.Set<OutboxMessage>()
            .Where(message => message.ProcessedAtUtc == null && message.Attempts < MaxAttempts)
            .OrderBy(message => message.OccurredAtUtc)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        foreach (OutboxMessage message in messages)
        {
            await SendAsync(message, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SendAsync(OutboxMessage message, CancellationToken cancellationToken)
    {
        try
        {
            foreach (IntegrationEventSubscription integrationEventSubscription in integrationEventSubscriptions.Where(subscription => subscription.EventType == message.Type))
            {
                // Each handler gets its own scope, so its module's DbContext starts clean.
                await using AsyncServiceScope handlerScope = scopeFactory.CreateAsyncScope();
                await integrationEventSubscription.HandleAsync(handlerScope.ServiceProvider, message.Content, cancellationToken);
            }

            message.MarkProcessed(timeProvider.GetUtcNow());
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            message.MarkFailed(exception.Message);
            LogMessageFailed(logger, exception, message.Id, message.Type, message.Attempts);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "The outbox could not be read.")]
    private static partial void LogBatchFailed(ILogger logger, Exception exception);

    [LoggerMessage(Level = LogLevel.Error, Message = "Outbox message {MessageId} ({MessageType}) failed, attempt {Attempts}.")]
    private static partial void LogMessageFailed(ILogger logger, Exception exception, Guid messageId, string messageType, int attempts);
}
