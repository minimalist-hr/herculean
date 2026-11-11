using System.ComponentModel;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Tickets.ListTickets;

[Description("A ticket in the list.")]
internal sealed record TicketListItemResponse(
    [property: Description("The ticket's ID.")] Guid Id,
    [property: Description("What it is about.")] TicketType Type,
    [property: Description("Where it stands.")] TicketStatus Status,
    [property: Description("The start of its first message, at most 200 characters.")] string Preview,
    [property: Description("When its latest message was sent.")] DateTimeOffset LastMessageAtUtc,
    [property: Description("Whether it has a reply the user hasn't opened.")] bool HasUnreadReply);
