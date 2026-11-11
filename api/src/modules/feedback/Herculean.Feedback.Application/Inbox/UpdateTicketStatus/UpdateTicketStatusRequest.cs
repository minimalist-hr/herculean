using System.ComponentModel;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox.UpdateTicketStatus;

[Description("A ticket's new status.")]
internal sealed record UpdateTicketStatusRequest(
    [property: Description("Closed, or open to reopen it. Answered comes only from a reply.")] TicketStatus Status);
