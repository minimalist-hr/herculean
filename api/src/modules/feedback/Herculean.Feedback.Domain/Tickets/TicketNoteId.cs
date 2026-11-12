using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

internal readonly record struct TicketNoteId(Guid Value) : ITypedId<TicketNoteId>
{
    public static TicketNoteId New() => new(Guid.CreateVersion7());

    public static TicketNoteId From(Guid value) => new(value);
}
