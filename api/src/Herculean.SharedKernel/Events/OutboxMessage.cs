using System.Text.Json;

namespace Herculean.SharedKernel.Events;

/// <summary>An event saved in the same transaction as the change that raised it, until the outbox job sends it.</summary>
public sealed class OutboxMessage
{
    private OutboxMessage(Guid id, string type, string content, DateTimeOffset occurredAtUtc)
    {
        Id = id;
        Type = type;
        Content = content;
        OccurredAtUtc = occurredAtUtc;
    }

    /// <summary>The message's ID.</summary>
    public Guid Id { get; private set; }

    /// <summary>The event's full type name, for example <c>Herculean.Account.Contracts.AccountCreatedIntegrationEvent</c>.</summary>
    public string Type { get; private set; }

    /// <summary>The event as JSON.</summary>
    public string Content { get; private set; }

    /// <summary>When the event happened.</summary>
    public DateTimeOffset OccurredAtUtc { get; private set; }

    /// <summary>When every handler finished, or null while it waits.</summary>
    public DateTimeOffset? ProcessedAtUtc { get; private set; }

    /// <summary>How many times sending it failed.</summary>
    public int Attempts { get; private set; }

    /// <summary>The last failure, or null.</summary>
    public string? Error { get; private set; }

    internal static JsonSerializerOptions JsonOptions { get; } = JsonSerializerOptions.Web;

    /// <summary>Creates the message for an event.</summary>
    /// <typeparam name="TEvent">The event, from the sending module's Contracts.</typeparam>
    /// <param name="event">The event.</param>
    /// <param name="occurredAtUtc">When the event happened.</param>
    public static OutboxMessage Create<TEvent>(TEvent @event, DateTimeOffset occurredAtUtc)
        where TEvent : class =>
        new(Guid.CreateVersion7(occurredAtUtc), TypeOf<TEvent>(), JsonSerializer.Serialize(@event, JsonOptions), occurredAtUtc);

    internal static string TypeOf<TEvent>() => typeof(TEvent).FullName!;

    internal void MarkProcessed(DateTimeOffset processedAtUtc)
    {
        ProcessedAtUtc = processedAtUtc;
        Error = null;
    }

    internal void MarkFailed(string error)
    {
        Attempts++;
        Error = error;
    }
}
