using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Routines;

internal readonly record struct RoutineId(Guid Value) : ITypedId<RoutineId>
{
    public static RoutineId New() => new(Guid.CreateVersion7());

    public static RoutineId From(Guid value) => new(value);
}
