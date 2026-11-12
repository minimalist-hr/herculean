using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Starter;

internal readonly record struct StarterGroupId(Guid Value) : ITypedId<StarterGroupId>
{
    public static StarterGroupId New() => new(Guid.CreateVersion7());

    public static StarterGroupId From(Guid value) => new(value);
}
