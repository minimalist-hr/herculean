namespace Herculean.Account.Domain;

/// <summary>Saves an event for other modules with the unit of work, in the same transaction as the change.</summary>
internal interface IOutbox
{
    void Add<TEvent>(TEvent @event)
        where TEvent : class;
}
