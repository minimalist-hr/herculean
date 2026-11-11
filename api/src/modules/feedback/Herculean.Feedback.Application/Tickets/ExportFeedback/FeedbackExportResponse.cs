using System.ComponentModel;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Tickets.ExportFeedback;

[Description("Every ticket the user sent, for the data export.")]
internal sealed record FeedbackExportResponse(
    [property: Description("The tickets, oldest first.")] List<TicketExportResponse> Tickets);

[Description("A ticket in the export.")]
internal sealed record TicketExportResponse(
    [property: Description("What it is about.")] TicketType Type,
    [property: Description("Where it stands.")] TicketStatus Status,
    [property: Description("The app's version it was sent from.")] string AppVersion,
    [property: Description("The phone it was sent from, or null when it isn't known.")] string? Phone,
    [property: Description("The operating system it was sent from.")] string Os,
    [property: Description("Its messages, oldest first.")] List<MessageExportResponse> Messages);

[Description("A message in the export, with its screenshots.")]
internal sealed record MessageExportResponse(
    [property: Description("Who wrote it.")] MessageAuthor Author,
    [property: Description("Its text.")] string Text,
    [property: Description("When it was sent.")] DateTimeOffset SentAtUtc,
    [property: Description("Its screenshots in order, each a Base64 JPEG, which can be none.")] List<string> Screenshots);
