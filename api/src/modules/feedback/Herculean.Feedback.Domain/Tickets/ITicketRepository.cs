namespace Herculean.Feedback.Domain.Tickets;

internal interface ITicketRepository
{
    /// <summary>Counts the current user's tickets created since a moment.</summary>
    Task<int> CountCreatedSinceAsync(DateTimeOffset since, CancellationToken cancellationToken);

    /// <summary>One of the current user's tickets, without its messages, or null if there is none.</summary>
    Task<Ticket?> GetAsync(TicketId id, CancellationToken cancellationToken);

    /// <summary>Any user's ticket, without its messages, for an admin. Null if there is none.</summary>
    Task<Ticket?> GetAnyAsync(TicketId id, CancellationToken cancellationToken);

    void Add(Ticket ticket);
}
