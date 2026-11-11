using System.ComponentModel;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox.ListInboxTickets;

[Description("A ticket in the inbox.")]
internal sealed record InboxTicketListItemResponse(
    [property: Description("The ticket's ID.")] Guid Id,
    [property: Description("What it is about.")] TicketType Type,
    [property: Description("Where it stands.")] TicketStatus Status,
    [property: Description("The start of its first message, at most 200 characters.")] string Preview,
    [property: Description("When its latest message was sent.")] DateTimeOffset LastMessageAtUtc,
    [property: Description("Whether its latest message is the user's, so it waits for a reply.")] bool WaitingForReply,
    [property: Description("The sender's name, or null before setup or when the account is gone.")] string? SenderName,
    [property: Description("The sender's email, or null when the account is gone.")] string? SenderEmail);
