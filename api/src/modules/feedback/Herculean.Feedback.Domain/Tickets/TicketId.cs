using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

internal readonly record struct TicketId(Guid Value) : ITypedId<TicketId>
{
    public static TicketId New() => new(Guid.CreateVersion7());

    public static TicketId From(Guid value) => new(value);
}
