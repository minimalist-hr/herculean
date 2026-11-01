using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Exercises;

internal readonly record struct ExerciseAlsoWorksId(Guid Value) : ITypedId<ExerciseAlsoWorksId>
{
    public static ExerciseAlsoWorksId New() => new(Guid.CreateVersion7());

    public static ExerciseAlsoWorksId From(Guid value) => new(value);
}
