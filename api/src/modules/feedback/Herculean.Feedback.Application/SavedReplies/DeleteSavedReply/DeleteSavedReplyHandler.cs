using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.SavedReplies;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.SavedReplies.DeleteSavedReply;

internal sealed class DeleteSavedReplyHandler(ISavedReplyRepository savedReplyRepository, IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        SavedReply? savedReply = await savedReplyRepository.GetAsync(SavedReplyId.From(id), cancellationToken);
        if (savedReply is null)
        {
            return SavedReplyErrors.NotFound;
        }

        savedReplyRepository.Remove(savedReply);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
