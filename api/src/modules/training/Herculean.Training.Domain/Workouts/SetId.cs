using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Workouts;

internal readonly record struct SetId(Guid Value) : ITypedId<SetId>
{
    public static SetId New() => new(Guid.CreateVersion7());

    public static SetId From(Guid value) => new(value);
}
