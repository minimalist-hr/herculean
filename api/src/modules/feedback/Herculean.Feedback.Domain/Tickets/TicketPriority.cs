using System.ComponentModel;

namespace Herculean.Feedback.Domain.Tickets;

[Description("How urgent a ticket is to Minimalist: normal, or high, which comes first in the inbox.")]
internal enum TicketPriority
{
    Normal,
    High,
}
