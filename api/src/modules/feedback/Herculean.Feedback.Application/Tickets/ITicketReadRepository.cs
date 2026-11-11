using Herculean.Feedback.Application.Tickets.ExportFeedback;
using Herculean.Feedback.Application.Tickets.GetTicket;
using Herculean.Feedback.Application.Tickets.ListTickets;
using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Tickets;

internal interface ITicketReadRepository
{
    /// <summary>The current user's tickets, the latest message first.</summary>
    Task<List<TicketListItemResponse>> ListAsync(CancellationToken cancellationToken);

    /// <summary>One of the current user's tickets with its messages, or null if there is none.</summary>
    Task<TicketResponse?> GetAsync(TicketId id, CancellationToken cancellationToken);

    /// <summary>A screenshot on one of the current user's tickets, or null if there is none.</summary>
    Task<byte[]?> GetScreenshotAsync(TicketId ticketId, ScreenshotId screenshotId, CancellationToken cancellationToken);

    /// <summary>Every ticket of the current user with its messages and screenshots, oldest first.</summary>
    Task<FeedbackExportResponse> ExportAsync(CancellationToken cancellationToken);

    /// <summary>Counts the current user's tickets with a reply they haven't opened.</summary>
    Task<int> CountUnreadAsync(CancellationToken cancellationToken);
}
