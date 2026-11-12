using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain.SavedReplies;

internal readonly record struct SavedReplyId(Guid Value) : ITypedId<SavedReplyId>
{
    public static SavedReplyId New() => new(Guid.CreateVersion7());

    public static SavedReplyId From(Guid value) => new(value);
}
