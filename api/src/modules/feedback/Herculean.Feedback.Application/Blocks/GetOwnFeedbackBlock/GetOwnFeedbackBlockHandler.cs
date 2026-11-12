using Herculean.Feedback.Domain.Blocks;
using Herculean.SharedKernel.Results;

namespace Herculean.Feedback.Application.Blocks.GetOwnFeedbackBlock;

internal sealed class GetOwnFeedbackBlockHandler(IFeedbackBlockRepository blockRepository)
{
    public async Task<Result<FeedbackBlockResponse>> HandleAsync(CancellationToken cancellationToken) =>
        new FeedbackBlockResponse(await blockRepository.IsCurrentUserBlockedAsync(cancellationToken));
}
