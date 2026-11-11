namespace Herculean.Feedback.Application.Inbox.GetFeedbackStats;

internal sealed class GetFeedbackStatsHandler(IInboxReadRepository inboxReadRepository)
{
    public async Task<FeedbackStatsResponse> HandleAsync(CancellationToken cancellationToken) =>
        new(await inboxReadRepository.CountWaitingAsync(cancellationToken));
}
