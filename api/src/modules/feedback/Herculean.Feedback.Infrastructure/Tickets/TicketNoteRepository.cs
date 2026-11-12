using Herculean.Feedback.Domain.Tickets;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.Tickets;

/// <summary>Admins read any user's notes, so the user filter is off.</summary>
internal sealed class TicketNoteRepository(FeedbackDbContext dbContext) : ITicketNoteRepository
{
    public Task<TicketNote?> GetAsync(TicketId ticketId, TicketNoteId noteId, CancellationToken cancellationToken) =>
        dbContext.TicketNotes
            .IgnoreQueryFilters([FeedbackDbContext.UserFilter])
            .SingleOrDefaultAsync(note => note.TicketId == ticketId && note.Id == noteId, cancellationToken);

    public void Add(TicketNote note)
    {
        dbContext.TicketNotes.Add(note);
    }

    public void Remove(TicketNote note)
    {
        dbContext.TicketNotes.Remove(note);
    }
}
