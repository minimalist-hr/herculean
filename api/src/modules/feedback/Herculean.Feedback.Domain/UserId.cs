using Herculean.SharedKernel.Entities;

namespace Herculean.Feedback.Domain;

/// <summary>The user who sent the feedback. Account creates users; Feedback only refers to them.</summary>
internal readonly record struct UserId(Guid Value) : ITypedId<UserId>
{
    public static UserId From(Guid value) => new(value);
}
