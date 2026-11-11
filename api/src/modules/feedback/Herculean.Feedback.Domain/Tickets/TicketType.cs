using System.ComponentModel;

namespace Herculean.Feedback.Domain.Tickets;

[Description("What a ticket is about.")]
internal enum TicketType
{
    Bug,
    Suggestion,
    Other,
}
