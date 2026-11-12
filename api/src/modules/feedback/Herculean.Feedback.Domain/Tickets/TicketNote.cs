using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

/// <summary>A note on a ticket that only admins see. It belongs to the ticket's user, so it goes with their account.</summary>
internal sealed class TicketNote : Entity<TicketNoteId>
{
    internal const int TextMaxLength = 2000;

    private TicketNote(TicketNoteId id, UserId userId, TicketId ticketId, string text) : base(id)
    {
        UserId = userId;
        TicketId = ticketId;
        Text = text;
    }

    public UserId UserId { get; private set; }

    public TicketId TicketId { get; private set; }

    public string Text { get; private set; }

    public static TicketNote Create(Ticket ticket, string text) => new(TicketNoteId.New(), ticket.UserId, ticket.Id, text.Trim());
}
