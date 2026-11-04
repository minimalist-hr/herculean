using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Workouts;

internal readonly record struct WorkoutExerciseId(Guid Value) : ITypedId<WorkoutExerciseId>
{
    public static WorkoutExerciseId New() => new(Guid.CreateVersion7());

    public static WorkoutExerciseId From(Guid value) => new(value);
}
