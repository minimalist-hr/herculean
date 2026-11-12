using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Domain.Tickets;

internal static class TicketErrors
{
    public static readonly Error NotFound = Error.NotFound("ticket.not_found", "The ticket does not exist.");

    public static readonly Error ScreenshotNotFound = Error.NotFound("ticket.screenshot_not_found", "The screenshot does not exist.");

    public static readonly Error NoteNotFound = Error.NotFound("ticket.note_not_found", "The note does not exist.");

    public static readonly Error Closed = Error.Conflict("ticket.closed", "The ticket is closed, so it takes no replies.");

    public static readonly Error LimitReached = Error.Conflict("ticket.limit_reached", $"You can send at most {Ticket.MaxPerDay} tickets a day.");
}
