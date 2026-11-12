using Herculean.Feedback.Application.Inbox;
using Herculean.Feedback.Application.Inbox.GetInboxTicket;
using Herculean.Feedback.Application.Tickets.GetTicket;
using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;
using Herculean.Feedback.Infrastructure.Tickets;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.Inbox;

/// <summary>Reads every user's tickets: the user filter is off, since an admin reads them.</summary>
internal sealed class InboxReadRepository(FeedbackDbContext dbContext) : IInboxReadRepository
{
    public async Task<List<InboxListRow>> ListAsync(TicketStatus? status, UserId? userId, CancellationToken cancellationToken)
    {
        IQueryable<Ticket> query = Tickets().Where(ticket => status == null || ticket.Status == status);
        if (userId is UserId sender)
        {
            query = query.Where(ticket => ticket.UserId == sender);
        }

        var tickets = await query
            .Select(ticket => new
            {
                Id = ticket.Id.Value,
                UserId = ticket.UserId.Value,
                ticket.Type,
                ticket.Status,
                FirstMessage = ticket.Messages.OrderBy(message => message.CreatedAtUtc).Select(message => message.Text).First(),
                LastMessageAtUtc = ticket.Messages.Max(message => message.CreatedAtUtc),
                LastAuthor = ticket.Messages.OrderByDescending(message => message.CreatedAtUtc).Select(message => message.Author).First(),
                ticket.Priority,
            })
            .ToListAsync(cancellationToken);

        return
        [
            .. tickets
                .OrderByDescending(ticket => ticket.Priority == TicketPriority.High)
                .ThenByDescending(ticket => ticket.LastMessageAtUtc)
                .Select(ticket => new InboxListRow(
                    ticket.Id,
                    ticket.UserId,
                    ticket.Type,
                    ticket.Status,
                    TicketReadRepository.PreviewOf(ticket.FirstMessage),
                    ticket.LastMessageAtUtc,
                    ticket.LastAuthor == MessageAuthor.User,
                    ticket.Priority)),
        ];
    }

    public async Task<(int Waiting, int HighWaiting)> CountWaitingAsync(CancellationToken cancellationToken)
    {
        List<TicketPriority> waiting = await Tickets()
            .Where(ticket => ticket.Status != TicketStatus.Closed)
            .Where(ticket => ticket.Messages.OrderByDescending(message => message.CreatedAtUtc).Select(message => message.Author).First() == MessageAuthor.User)
            .Select(ticket => ticket.Priority)
            .ToListAsync(cancellationToken);

        return (waiting.Count, waiting.Count(priority => priority == TicketPriority.High));
    }

    public async Task<InboxTicketRow?> GetAsync(TicketId id, CancellationToken cancellationToken)
    {
        InboxTicketRow? row = await Tickets()
            .Where(ticket => ticket.Id == id)
            .Select(ticket => new InboxTicketRow(
                ticket.Id.Value,
                ticket.UserId.Value,
                ticket.Type,
                ticket.Status,
                ticket.AppVersion,
                ticket.Phone,
                ticket.Os,
                ticket.Priority,
                ticket.Messages
                    .OrderBy(message => message.CreatedAtUtc)
                    .Select(message => new TicketMessageResponse(
                        message.Id.Value,
                        message.Author,
                        message.Text,
                        message.CreatedAtUtc,
                        message.Screenshots.OrderBy(screenshot => screenshot.Order).Select(screenshot => screenshot.Id.Value).ToList()))
                    .ToList(),
                new List<TicketNoteResponse>()))
            .SingleOrDefaultAsync(cancellationToken);
        if (row is null)
        {
            return null;
        }

        List<TicketNoteResponse> notes = await dbContext.TicketNotes
            .IgnoreQueryFilters([FeedbackDbContext.UserFilter])
            .AsNoTracking()
            .Where(note => note.TicketId == id)
            .OrderBy(note => note.CreatedAtUtc)
            .Select(note => new TicketNoteResponse(note.Id.Value, note.Text, note.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return row with { Notes = notes };
    }

    public Task<byte[]?> GetScreenshotAsync(TicketId ticketId, ScreenshotId screenshotId, CancellationToken cancellationToken) =>
        dbContext.Set<TicketMessage>()
            .IgnoreQueryFilters([FeedbackDbContext.UserFilter])
            .AsNoTracking()
            .Where(message => message.TicketId == ticketId)
            .SelectMany(message => message.Screenshots)
            .Where(screenshot => screenshot.Id == screenshotId)
            .Select(screenshot => screenshot.Image)
            .SingleOrDefaultAsync(cancellationToken);

    // Turning the filter off at the root turns it off for the messages and screenshots too.
    private IQueryable<Ticket> Tickets() =>
        dbContext.Tickets.IgnoreQueryFilters([FeedbackDbContext.UserFilter]).AsNoTracking();
}
