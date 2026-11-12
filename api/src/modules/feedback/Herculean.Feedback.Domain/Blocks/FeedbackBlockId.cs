using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.Blocks;

internal readonly record struct FeedbackBlockId(Guid Value) : ITypedId<FeedbackBlockId>
{
    public static FeedbackBlockId New() => new(Guid.CreateVersion7());

    public static FeedbackBlockId From(Guid value) => new(value);
}
