using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain;

/// <summary>The user who owns the training data. Account creates users; Training only refers to them.</summary>
internal readonly record struct UserId(Guid Value) : ITypedId<UserId>
{
    public static UserId From(Guid value) => new(value);
}
