using Herculean.Feedback.Application.SavedReplies;
using Herculean.Feedback.Application.SavedReplies.ListSavedReplies;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Feedback.Infrastructure.SavedReplies;

internal sealed class SavedReplyReadRepository(FeedbackDbContext dbContext) : ISavedReplyReadRepository
{
    public Task<List<SavedReplyResponse>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.SavedReplies
            .AsNoTracking()
            .OrderBy(savedReply => savedReply.CreatedAtUtc)
            .Select(savedReply => new SavedReplyResponse(savedReply.Id.Value, savedReply.Title, savedReply.Text))
            .ToListAsync(cancellationToken);
}
