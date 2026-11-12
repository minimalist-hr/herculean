namespace Herculean.Feedback.Domain.Blocks;

internal interface IFeedbackBlockRepository
{
    /// <summary>Whether the current user is blocked from sending feedback.</summary>
    Task<bool> IsCurrentUserBlockedAsync(CancellationToken cancellationToken);

    /// <summary>Any user's block, for an admin. Null when they aren't blocked.</summary>
    Task<FeedbackBlock?> GetAsync(UserId userId, CancellationToken cancellationToken);

    void Add(FeedbackBlock block);

    void Remove(FeedbackBlock block);
}
