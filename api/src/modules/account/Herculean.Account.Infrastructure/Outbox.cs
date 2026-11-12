using Herculean.Account.Domain;
using Herculean.SharedKernel.Events;

namespace Herculean.Account.Infrastructure;

internal sealed class Outbox(AccountDbContext dbContext, TimeProvider timeProvider) : IOutbox
{
    public void Add<TEvent>(TEvent @event)
        where TEvent : class
    {
        dbContext.Set<OutboxMessage>().Add(OutboxMessage.Create(@event, timeProvider.GetUtcNow()));
    }

    public Task DeleteSentAsync(CancellationToken cancellationToken) =>
        dbContext.DeleteSentOutboxMessagesAsync(cancellationToken);
}
