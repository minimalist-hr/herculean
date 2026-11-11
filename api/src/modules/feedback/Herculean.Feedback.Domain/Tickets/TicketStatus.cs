using System.ComponentModel;

namespace Herculean.Feedback.Domain.Tickets;

[Description("Where a ticket stands: open waits for Minimalist, answered waits for the user, and closed is done.")]
internal enum TicketStatus
{
    Open,
    Answered,
    Closed,
}
