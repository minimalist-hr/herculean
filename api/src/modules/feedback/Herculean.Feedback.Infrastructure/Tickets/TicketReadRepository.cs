using Herculean.Feedback.Application.Tickets;
using Herculean.Feedback.Application.Tickets.ExportFeedback;
using Herculean.Feedback.Application.Tickets.GetTicket;
using Herculean.Feedback.Application.Tickets.ListTickets;
using Herculean.Feedback.Domain.Tickets;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.Tickets;

internal sealed class TicketReadRepository(FeedbackDbContext dbContext) : ITicketReadRepository
{
    internal const int PreviewMaxLength = 200;

    /// <summary>The start of a ticket's first message, for a list.</summary>
    internal static string PreviewOf(string message) =>
        message.Length > PreviewMaxLength ? message[..PreviewMaxLength] : message;

    public async Task<List<TicketListItemResponse>> ListAsync(CancellationToken cancellationToken)
    {
        var tickets = await dbContext.Tickets
            .AsNoTracking()
            .Select(ticket => new
            {
                Id = ticket.Id.Value,
                ticket.Type,
                ticket.Status,
                FirstMessage = ticket.Messages.OrderBy(message => message.CreatedAtUtc).Select(message => message.Text).First(),
                LastMessageAtUtc = ticket.Messages.Max(message => message.CreatedAtUtc),
                ticket.HasUnreadReply,
            })
            .ToListAsync(cancellationToken);

        return
        [
            .. tickets
                .OrderByDescending(ticket => ticket.LastMessageAtUtc)
                .Select(ticket => new TicketListItemResponse(
                    ticket.Id,
                    ticket.Type,
                    ticket.Status,
                    PreviewOf(ticket.FirstMessage),
                    ticket.LastMessageAtUtc,
                    ticket.HasUnreadReply)),
        ];
    }

    public Task<TicketResponse?> GetAsync(TicketId id, CancellationToken cancellationToken) =>
        dbContext.Tickets
            .AsNoTracking()
            .Where(ticket => ticket.Id == id)
            .Select(ticket => new TicketResponse(
                ticket.Id.Value,
                ticket.Type,
                ticket.Status,
                ticket.HasUnreadReply,
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
        dbContext.Set<Screenshot>()
            .AsNoTracking()
            .Where(screenshot => screenshot.Id == screenshotId
                && dbContext.Set<TicketMessage>().Any(message => message.Id == screenshot.MessageId && message.TicketId == ticketId))
            .Select(screenshot => screenshot.Image)
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<FeedbackExportResponse> ExportAsync(CancellationToken cancellationToken)
    {
        var tickets = await dbContext.Tickets
            .AsNoTracking()
            .OrderBy(ticket => ticket.CreatedAtUtc)
            .Select(ticket => new
            {
                ticket.Type,
                ticket.Status,
                ticket.AppVersion,
                ticket.Phone,
                ticket.Os,
                Messages = ticket.Messages
                    .OrderBy(message => message.CreatedAtUtc)
                    .Select(message => new
                    {
                        message.Author,
                        message.Text,
                        message.CreatedAtUtc,
                        Screenshots = message.Screenshots.OrderBy(screenshot => screenshot.Order).Select(screenshot => screenshot.Image).ToList(),
                    })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);

        // Base64 is made here: Postgres would break its lines.
        return new FeedbackExportResponse(
        [
            .. tickets.Select(ticket => new TicketExportResponse(
                ticket.Type,
                ticket.Status,
                ticket.AppVersion,
                ticket.Phone,
                ticket.Os,
                [
                    .. ticket.Messages.Select(message => new MessageExportResponse(
                        message.Author,
                        message.Text,
                        message.CreatedAtUtc,
                        [.. message.Screenshots.Select(Convert.ToBase64String)])),
                ])),
        ]);
    }

    public Task<int> CountUnreadAsync(CancellationToken cancellationToken) =>
        dbContext.Tickets.CountAsync(ticket => ticket.HasUnreadReply, cancellationToken);
}
