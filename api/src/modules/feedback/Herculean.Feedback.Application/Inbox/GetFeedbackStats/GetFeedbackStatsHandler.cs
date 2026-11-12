namespace Herculean.Feedback.Application.Inbox.GetFeedbackStats;

internal sealed class GetFeedbackStatsHandler(IInboxReadRepository inboxReadRepository)
{
    public async Task<FeedbackStatsResponse> HandleAsync(CancellationToken cancellationToken)
    {
        (int waiting, int highWaiting) = await inboxReadRepository.CountWaitingAsync(cancellationToken);

        return new FeedbackStatsResponse(waiting, highWaiting);
    }
}
