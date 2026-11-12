using Herculean.Feedback.Application.SavedReplies.ListSavedReplies;

namespace Herculean.Feedback.Application.SavedReplies;

internal interface ISavedReplyReadRepository
{
    /// <summary>Every saved reply, in the order they were made.</summary>
    Task<List<SavedReplyResponse>> ListAsync(CancellationToken cancellationToken);
}
