namespace Herculean.SharedKernel.Events;

/// <summary>Handles an event from another module. It must be idempotent: the outbox can send an event twice.</summary>
/// <typeparam name="TEvent">The event, from the sending module's Contracts.</typeparam>
public interface IIntegrationEventHandler<in TEvent>
    where TEvent : class
{
    /// <summary>Handles the event.</summary>
    /// <param name="event">The event.</param>
    /// <param name="cancellationToken">Stops the handler.</param>
    Task HandleAsync(TEvent @event, CancellationToken cancellationToken);
}
