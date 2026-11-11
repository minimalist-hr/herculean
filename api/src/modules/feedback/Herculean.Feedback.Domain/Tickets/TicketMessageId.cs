using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Tickets;

internal readonly record struct TicketMessageId(Guid Value) : ITypedId<TicketMessageId>
{
    public static TicketMessageId New() => new(Guid.CreateVersion7());

    public static TicketMessageId From(Guid value) => new(value);
}
