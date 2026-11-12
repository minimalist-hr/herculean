using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Blocks;

/// <summary>A user Minimalist stopped from sending feedback. They can still read their tickets.</summary>
internal sealed class FeedbackBlock : Entity<FeedbackBlockId>
{
    private FeedbackBlock(FeedbackBlockId id, UserId userId) : base(id)
    {
        UserId = userId;
    }

    public UserId UserId { get; private set; }

    public static FeedbackBlock Create(UserId userId) => new(FeedbackBlockId.New(), userId);
}
