using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Exercises;

internal readonly record struct ExerciseId(Guid Value) : ITypedId<ExerciseId>
{
    public static ExerciseId New() => new(Guid.CreateVersion7());

    public static ExerciseId From(Guid value) => new(value);
}
