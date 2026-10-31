using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Herculean.SharedKernel.Events;

/// <summary>Registers outboxes and event handlers by name. Nothing is found by scanning.</summary>
public static class IntegrationEventServiceCollectionExtensions
{
    /// <summary>Adds the job that sends a module's saved events, and the signal that wakes it.</summary>
    /// <typeparam name="TContext">The module's DbContext, which holds its outbox.</typeparam>
    /// <param name="services">The API's services.</param>
    public static IServiceCollection AddOutbox<TContext>(this IServiceCollection services)
        where TContext : DbContext
    {
        services.AddSingleton<OutboxSignal<TContext>>();
        services.AddHostedService<OutboxProcessor<TContext>>();

        return services;
    }

    /// <summary>Adds a handler for an event from another module.</summary>
    /// <typeparam name="TEvent">The event, from the sending module's Contracts.</typeparam>
    /// <typeparam name="THandler">The handler.</typeparam>
    /// <param name="services">The API's services.</param>
    public static IServiceCollection AddIntegrationEventHandler<TEvent, THandler>(this IServiceCollection services)
        where TEvent : class
        where THandler : class, IIntegrationEventHandler<TEvent>
    {
        services.AddScoped<THandler>();
        services.AddSingleton(new IntegrationEventSubscription(OutboxMessage.TypeOf<TEvent>(), async (handlerServices, content, cancellationToken) =>
        {
            TEvent @event = JsonSerializer.Deserialize<TEvent>(content, OutboxMessage.JsonOptions)
                ?? throw new JsonException($"The {typeof(TEvent).Name} message is empty.");

            await handlerServices.GetRequiredService<THandler>().HandleAsync(@event, cancellationToken);
        }));

        return services;
    }
}
