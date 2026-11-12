using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;

namespace Herculean.Feedback.Application.Inbox;

/// <summary>Every user's tickets, for an admin.</summary>
internal interface IInboxReadRepository
{
    /// <summary>The tickets in a status, or all of them, from one user or everyone: high priority first, then the latest message first.</summary>
    Task<List<InboxListRow>> ListAsync(TicketStatus? status, UserId? userId, CancellationToken cancellationToken);

    /// <summary>Counts the tickets, not closed, whose latest message is the user's, and how many of those are high priority.</summary>
    Task<(int Waiting, int HighWaiting)> CountWaitingAsync(CancellationToken cancellationToken);

    /// <summary>A ticket with its messages, or null if there is none.</summary>
    Task<InboxTicketRow?> GetAsync(TicketId id, CancellationToken cancellationToken);

    /// <summary>A screenshot on a ticket, or null if there is none.</summary>
    Task<byte[]?> GetScreenshotAsync(TicketId ticketId, ScreenshotId screenshotId, CancellationToken cancellationToken);
}
