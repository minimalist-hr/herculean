namespace Herculean.SharedKernel.Events;

// One handler of one event. The handler reads the event from the message's JSON.
internal sealed record IntegrationEventSubscription(string EventType, Func<IServiceProvider, string, CancellationToken, Task> HandleAsync);
