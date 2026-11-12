using Herculean.Feedback.Application.Inbox;
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
            })
            .ToListAsync(cancellationToken);

        return
        [
            .. tickets
                .OrderByDescending(ticket => ticket.LastMessageAtUtc)
                .Select(ticket => new InboxListRow(
                    ticket.Id,
                    ticket.UserId,
                    ticket.Type,
                    ticket.Status,
                    TicketReadRepository.PreviewOf(ticket.FirstMessage),
                    ticket.LastMessageAtUtc,
                    ticket.LastAuthor == MessageAuthor.User)),
        ];
    }

    public Task<int> CountWaitingAsync(CancellationToken cancellationToken) =>
        Tickets()
            .Where(ticket => ticket.Status != TicketStatus.Closed)
            .CountAsync(
                ticket => ticket.Messages.OrderByDescending(message => message.CreatedAtUtc).Select(message => message.Author).First() == MessageAuthor.User,
                cancellationToken);

    public Task<InboxTicketRow?> GetAsync(TicketId id, CancellationToken cancellationToken) =>
        Tickets()
            .Where(ticket => ticket.Id == id)
            .Select(ticket => new InboxTicketRow(
                ticket.Id.Value,
                ticket.UserId.Value,
                ticket.Type,
                ticket.Status,
                ticket.AppVersion,
                ticket.Phone,
                ticket.Os,
                ticket.Messages
                    .OrderBy(message => message.CreatedAtUtc)
                    .Select(message => new TicketMessageResponse(
                        message.Id.Value,
                        message.Author,
                        message.Text,
                        message.CreatedAtUtc,
                        message.Screenshots.OrderBy(screenshot => screenshot.Order).Select(screenshot => screenshot.Id.Value).ToList()))
                    .ToList()))
            .SingleOrDefaultAsync(cancellationToken);

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
