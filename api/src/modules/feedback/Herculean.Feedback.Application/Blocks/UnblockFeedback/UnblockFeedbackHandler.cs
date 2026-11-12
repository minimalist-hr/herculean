using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Blocks;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Blocks.UnblockFeedback;

internal sealed class UnblockFeedbackHandler(IFeedbackBlockRepository blockRepository, IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        FeedbackBlock? block = await blockRepository.GetAsync(UserId.From(id), cancellationToken);
        if (block is not null)
        {
            blockRepository.Remove(block);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Result.Success();
    }
}
