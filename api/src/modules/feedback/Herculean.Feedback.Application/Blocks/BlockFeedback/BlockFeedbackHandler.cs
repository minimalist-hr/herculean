using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Blocks;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Blocks.BlockFeedback;

internal sealed class BlockFeedbackHandler(IFeedbackBlockRepository blockRepository, IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        UserId userId = UserId.From(id);
        if (await blockRepository.GetAsync(userId, cancellationToken) is null)
        {
            blockRepository.Add(FeedbackBlock.Create(userId));
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return Result.Success();
    }
}
