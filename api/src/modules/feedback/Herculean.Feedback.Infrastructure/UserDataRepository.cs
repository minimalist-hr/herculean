using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Tickets;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure;

internal sealed class UserDataRepository(FeedbackDbContext dbContext) : IUserDataRepository
{
    public async Task RemoveAllAsync(UserId userId, CancellationToken cancellationToken)
    {
        await RemoveAsync(dbContext.TicketNotes.Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.FeedbackBlocks.Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Set<Screenshot>().Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Set<TicketMessage>().Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Tickets.Where(row => row.UserId == userId), cancellationToken);
    }

    private async Task RemoveAsync<TRow>(IQueryable<TRow> rows, CancellationToken cancellationToken)
        where TRow : class
    {
        // Runs with no signed-in user.
        List<TRow> found = await rows.IgnoreQueryFilters().ToListAsync(cancellationToken);
        dbContext.RemoveRange(found);
    }
}
