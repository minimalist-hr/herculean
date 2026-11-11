using System.ComponentModel;

using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Tickets.CreateTicket;

[Description("New feedback.")]
internal sealed record CreateTicketRequest(
    [property: Description("What it is about.")] TicketType Type,
    [property: Description("The message, 1 to 2,000 characters. Spaces around it are removed.")] string Message,
    [property: Description("Up to 4 screenshots, each a Base64 JPEG of at most 1 MB, or none.")] List<string>? Screenshots,
    [property: Description("The app's version, for example 1.0.0, at most 50 characters.")] string AppVersion,
    [property: Description("The phone's maker and model, at most 100 characters, or null when it isn't known, as on the web.")] string? Phone,
    [property: Description("The operating system and its version, for example Android 15, at most 50 characters.")] string Os) : IMessageFields;
