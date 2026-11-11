using System.ComponentModel;

namespace Herculean.Feedback.Application.Tickets.CreateTicket;

[Description("The new ticket.")]
internal sealed record TicketCreatedResponse(
    [property: Description("The ticket's ID.")] Guid Id);
