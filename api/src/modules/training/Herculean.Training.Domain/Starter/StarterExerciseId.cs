using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Starter;

internal readonly record struct StarterExerciseId(Guid Value) : ITypedId<StarterExerciseId>
{
    public static StarterExerciseId New() => new(Guid.CreateVersion7());

    public static StarterExerciseId From(Guid value) => new(value);
}
