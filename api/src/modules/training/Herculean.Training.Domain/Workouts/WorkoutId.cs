using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Workouts;

internal readonly record struct WorkoutId(Guid Value) : ITypedId<WorkoutId>
{
    public static WorkoutId New() => new(Guid.CreateVersion7());

    public static WorkoutId From(Guid value) => new(value);
}
