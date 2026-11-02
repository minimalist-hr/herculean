using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Routines;

internal readonly record struct RoutineExerciseId(Guid Value) : ITypedId<RoutineExerciseId>
{
    public static RoutineExerciseId New() => new(Guid.CreateVersion7());

    public static RoutineExerciseId From(Guid value) => new(value);
}
