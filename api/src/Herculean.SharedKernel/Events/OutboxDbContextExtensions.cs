using Microsoft.EntityFrameworkCore;

namespace Herculean.SharedKernel.Events;

/// <summary>Keeps a module's outbox small.</summary>
public static class OutboxDbContextExtensions
{
    /// <summary>Deletes the events every handler finished, without loading them. Failed ones stay, with their last error.</summary>
    /// <param name="dbContext">The module's DbContext, which holds its outbox.</param>
    /// <param name="cancellationToken">Stops the delete.</param>
    public static Task<int> DeleteSentOutboxMessagesAsync(this DbContext dbContext, CancellationToken cancellationToken) =>
        dbContext.Set<OutboxMessage>()
            .Where(message => message.ProcessedAtUtc != null)
            .ExecuteDeleteAsync(cancellationToken);
}
