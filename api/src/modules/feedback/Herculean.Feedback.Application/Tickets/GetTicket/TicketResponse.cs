using System.ComponentModel;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Tickets.GetTicket;

[Description("A ticket with its thread.")]
internal sealed record TicketResponse(
    [property: Description("The ticket's ID.")] Guid Id,
    [property: Description("What it is about.")] TicketType Type,
    [property: Description("Where it stands.")] TicketStatus Status,
    [property: Description("Whether it has a reply the user hasn't opened. Mark it read once it shows.")] bool HasUnreadReply,
    [property: Description("Its messages, oldest first.")] List<TicketMessageResponse> Messages);

[Description("A message in a ticket's thread.")]
internal sealed record TicketMessageResponse(
    [property: Description("The message's ID.")] Guid Id,
    [property: Description("Who wrote it.")] MessageAuthor Author,
    [property: Description("Its text.")] string Text,
    [property: Description("When it was sent.")] DateTimeOffset SentAtUtc,
    [property: Description("Its screenshots' IDs in order, which can be none. Each one loads on its own.")] List<Guid> ScreenshotIds);
