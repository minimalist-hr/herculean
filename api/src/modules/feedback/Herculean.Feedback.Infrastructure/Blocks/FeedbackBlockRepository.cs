using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Blocks;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.Blocks;

internal sealed class FeedbackBlockRepository(FeedbackDbContext dbContext) : IFeedbackBlockRepository
{
    // The user filter keeps this to the signed-in user.
    public Task<bool> IsCurrentUserBlockedAsync(CancellationToken cancellationToken) =>
        dbContext.FeedbackBlocks.AnyAsync(cancellationToken);

    public Task<FeedbackBlock?> GetAsync(UserId userId, CancellationToken cancellationToken) =>
        dbContext.FeedbackBlocks
            .IgnoreQueryFilters([FeedbackDbContext.UserFilter])
            .SingleOrDefaultAsync(block => block.UserId == userId, cancellationToken);

    public void Add(FeedbackBlock block)
    {
        dbContext.FeedbackBlocks.Add(block);
    }

    public void Remove(FeedbackBlock block)
    {
        dbContext.FeedbackBlocks.Remove(block);
    }
}
