using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.SavedReplies.ListSavedReplies;

internal sealed class ListSavedRepliesHandler(ISavedReplyReadRepository savedReplyReadRepository)
{
    public async Task<Result<List<SavedReplyResponse>>> HandleAsync(CancellationToken cancellationToken) =>
        await savedReplyReadRepository.ListAsync(cancellationToken);
}
