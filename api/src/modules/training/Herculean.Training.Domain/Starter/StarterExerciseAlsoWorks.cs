using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Starter;

/// <summary>Another group a starter exercise works.</summary>
[AdminData]
internal sealed class StarterExerciseAlsoWorks : Entity<StarterExerciseAlsoWorksId>
{
    private StarterExerciseAlsoWorks(StarterExerciseAlsoWorksId id, StarterExerciseId exerciseId, StarterGroupId groupId) : base(id)
    {
        ExerciseId = exerciseId;
        GroupId = groupId;
    }

    public StarterExerciseId ExerciseId { get; private set; }

    public StarterGroupId GroupId { get; private set; }

    internal static StarterExerciseAlsoWorks Create(StarterExerciseId exerciseId, StarterGroupId groupId) =>
        new(StarterExerciseAlsoWorksId.New(), exerciseId, groupId);
}
