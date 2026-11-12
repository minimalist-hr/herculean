using System.ComponentModel;

using Herculean.Feedback.Application.Tickets.GetTicket;
using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox.GetInboxTicket;

[Description("A ticket in the inbox, with who sent it, from which device, and its thread.")]
internal sealed record InboxTicketResponse(
    [property: Description("The ticket's ID.")] Guid Id,
    [property: Description("What it is about.")] TicketType Type,
    [property: Description("Where it stands.")] TicketStatus Status,
    [property: Description("The sender's user ID, which stays after the account is gone.")] Guid SenderId,
    [property: Description("The sender's name, or null before setup or when the account is gone.")] string? SenderName,
    [property: Description("The sender's email, or null when the account is gone.")] string? SenderEmail,
    [property: Description("The app's version it was sent from.")] string AppVersion,
    [property: Description("The phone it was sent from, or null when it isn't known.")] string? Phone,
    [property: Description("The operating system it was sent from.")] string Os,
    [property: Description("How urgent it is.")] TicketPriority Priority,
    [property: Description("Its messages, oldest first.")] List<TicketMessageResponse> Messages,
    [property: Description("Notes only admins see, oldest first.")] List<TicketNoteResponse> Notes);

[Description("A note on a ticket, which only admins see.")]
internal sealed record TicketNoteResponse(
    [property: Description("The note's ID.")] Guid Id,
    [property: Description("What it says.")] string Text,
    [property: Description("When it was written.")] DateTimeOffset WrittenAtUtc);
