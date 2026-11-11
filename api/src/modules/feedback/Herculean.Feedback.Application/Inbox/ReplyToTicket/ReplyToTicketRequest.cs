using System.ComponentModel;

using Herculean.Feedback.Application.Tickets;

namespace Herculean.Feedback.Application.Inbox.ReplyToTicket;

[Description("Minimalist's reply to a ticket.")]
internal sealed record ReplyToTicketRequest(
    [property: Description("The message, 1 to 2,000 characters. Spaces around it are removed.")] string Message,
    [property: Description("Up to 4 screenshots, each a Base64 JPEG of at most 1 MB, or none.")] List<string>? Screenshots) : IMessageFields;
