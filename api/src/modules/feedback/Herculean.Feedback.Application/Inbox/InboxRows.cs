using Herculean.Feedback.Application.Inbox.GetInboxTicket;
using Herculean.Feedback.Application.Tickets.GetTicket;
using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox;

/// <summary>A ticket in the inbox, before its sender is named.</summary>
internal sealed record InboxListRow(
    Guid Id,
    Guid UserId,
    TicketType Type,
    TicketStatus Status,
    string Preview,
    DateTimeOffset LastMessageAtUtc,
    bool WaitingForReply,
    TicketPriority Priority);

/// <summary>A ticket with its thread, before its sender is named.</summary>
internal sealed record InboxTicketRow(
    Guid Id,
    Guid UserId,
    TicketType Type,
    TicketStatus Status,
    string AppVersion,
    string? Phone,
    string Os,
    TicketPriority Priority,
    List<TicketMessageResponse> Messages,
    List<TicketNoteResponse> Notes);
