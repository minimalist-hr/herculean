namespace Herculean.Feedback.Domain.Tickets;

internal interface ITicketNoteRepository
{
    /// <summary>A note on any user's ticket, for an admin. Null if there is none.</summary>
    Task<TicketNote?> GetAsync(TicketId ticketId, TicketNoteId noteId, CancellationToken cancellationToken);

    void Add(TicketNote note);

    void Remove(TicketNote note);
}
