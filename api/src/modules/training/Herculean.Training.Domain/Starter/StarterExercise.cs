using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Starter;

/// <summary>An exercise every new account starts with. Minimalist owns it, and accounts already made keep their own copies.</summary>
[AdminData]
internal sealed class StarterExercise : Entity<StarterExerciseId>
{
    private readonly List<StarterExerciseAlsoWorks> _alsoWorks = [];

    private StarterExercise(StarterExerciseId id, string name, StarterGroupId groupId) : base(id)
    {
        Name = name.Trim();
        NormalizedName = Exercise.NormalizeName(name);
        GroupId = groupId;
    }

    public string Name { get; private set; }

    /// <summary>For finding the name regardless of case.</summary>
    public string NormalizedName { get; private set; }

    public StarterGroupId GroupId { get; private set; }

    public IReadOnlyList<StarterExerciseAlsoWorks> AlsoWorks => _alsoWorks;

    public static StarterExercise Create(string name, StarterGroupId groupId, IEnumerable<StarterGroupId> alsoWorksGroupIds)
    {
        StarterExercise exercise = new(StarterExerciseId.New(), name, groupId);
        exercise._alsoWorks.AddRange(alsoWorksGroupIds.Select(alsoWorksGroupId => StarterExerciseAlsoWorks.Create(exercise.Id, alsoWorksGroupId)));

        return exercise;
    }

    public void Update(string name, StarterGroupId groupId, IReadOnlyCollection<StarterGroupId> alsoWorksGroupIds)
    {
        Name = name.Trim();
        NormalizedName = Exercise.NormalizeName(name);
        GroupId = groupId;

        _alsoWorks.RemoveAll(alsoWorks => !alsoWorksGroupIds.Contains(alsoWorks.GroupId));
        IEnumerable<StarterGroupId> added = alsoWorksGroupIds.Where(alsoWorksGroupId => _alsoWorks.All(alsoWorks => alsoWorks.GroupId != alsoWorksGroupId));
        _alsoWorks.AddRange([.. added.Select(alsoWorksGroupId => StarterExerciseAlsoWorks.Create(Id, alsoWorksGroupId))]);
    }
}
