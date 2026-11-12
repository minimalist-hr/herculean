using Herculean.Feedback.Domain.SavedReplies;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.SavedReplies;

internal sealed class SavedReplyRepository(FeedbackDbContext dbContext) : ISavedReplyRepository
{
    public Task<SavedReply?> GetAsync(SavedReplyId id, CancellationToken cancellationToken) =>
        dbContext.SavedReplies.SingleOrDefaultAsync(savedReply => savedReply.Id == id, cancellationToken);

    public async Task<List<(SavedReplyId Id, string Title)>> ListTitlesAsync(CancellationToken cancellationToken) =>
        [.. (await dbContext.SavedReplies
            .AsNoTracking()
            .Select(savedReply => new { savedReply.Id, savedReply.Title })
            .ToListAsync(cancellationToken))
            .Select(savedReply => (savedReply.Id, savedReply.Title))];

    public void Add(SavedReply savedReply)
    {
        dbContext.SavedReplies.Add(savedReply);
    }

    public void Remove(SavedReply savedReply)
    {
        dbContext.SavedReplies.Remove(savedReply);
    }
}
