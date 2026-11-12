using Herculean.Feedback.Domain;
using Herculean.Feedback.Domain.Blocks;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Blocks.GetFeedbackBlock;

internal sealed class GetFeedbackBlockHandler(IFeedbackBlockRepository blockRepository)
{
    public async Task<Result<FeedbackBlockResponse>> HandleAsync(Guid id, CancellationToken cancellationToken) =>
        new FeedbackBlockResponse(await blockRepository.GetAsync(UserId.From(id), cancellationToken) is not null);
}
