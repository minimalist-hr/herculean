using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Starter;

internal readonly record struct StarterExerciseAlsoWorksId(Guid Value) : ITypedId<StarterExerciseAlsoWorksId>
{
    public static StarterExerciseAlsoWorksId New() => new(Guid.CreateVersion7());

    public static StarterExerciseAlsoWorksId From(Guid value) => new(value);
}
