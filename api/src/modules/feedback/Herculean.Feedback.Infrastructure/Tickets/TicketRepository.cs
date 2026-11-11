using Herculean.Feedback.Domain.Tickets;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.Tickets;

internal sealed class TicketRepository(FeedbackDbContext dbContext) : ITicketRepository
{
    public Task<int> CountCreatedSinceAsync(DateTimeOffset since, CancellationToken cancellationToken) =>
        dbContext.Tickets.CountAsync(ticket => ticket.CreatedAtUtc >= since, cancellationToken);

    public Task<Ticket?> GetAsync(TicketId id, CancellationToken cancellationToken) =>
        dbContext.Tickets.SingleOrDefaultAsync(ticket => ticket.Id == id, cancellationToken);

    public void Add(Ticket ticket)
    {
        dbContext.Tickets.Add(ticket);
    }
}
