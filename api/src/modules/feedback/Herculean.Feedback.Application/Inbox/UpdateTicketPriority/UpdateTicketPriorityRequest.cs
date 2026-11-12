using System.ComponentModel;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox.UpdateTicketPriority;

[Description("A ticket's new priority.")]
internal sealed record UpdateTicketPriorityRequest(
    [property: Description("Normal or high.")] TicketPriority Priority);
