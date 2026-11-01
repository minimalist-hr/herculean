using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Domain.Exercises;

internal sealed class Exercise : Entity<ExerciseId>
{
    internal const int NameMaxLength = 100;

    /// <summary>Keeps the exercise list small enough to load whole.</summary>
    internal const int MaxPerUser = 500;

    private readonly List<ExerciseAlsoWorks> _alsoWorks = [];

    private Exercise(ExerciseId id, UserId userId, string name, string normalizedName, GroupId groupId) : base(id)
    {
        UserId = userId;
        Name = name;
        NormalizedName = normalizedName;
        GroupId = groupId;
    }

    public UserId UserId { get; private set; }

    public string Name { get; private set; }

    /// <summary>For finding the name regardless of case. See <see cref="NormalizeName"/>.</summary>
    public string NormalizedName { get; private set; }

    public GroupId GroupId { get; private set; }

    public Group Group { get; private set; } = null!;

    public IReadOnlyList<ExerciseAlsoWorks> AlsoWorks => _alsoWorks;

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    public static Exercise Create(UserId userId, string name, GroupId groupId, IEnumerable<GroupId> alsoWorksGroupIds)
    {
        Exercise exercise = new(ExerciseId.New(), userId, name.Trim(), NormalizeName(name), groupId);
        exercise._alsoWorks.AddRange(alsoWorksGroupIds.Select(alsoWorksGroupId => ExerciseAlsoWorks.Create(userId, exercise.Id, alsoWorksGroupId)));

        return exercise;
    }

    public void Update(string name, GroupId groupId, IReadOnlyCollection<GroupId> alsoWorksGroupIds)
    {
        Name = name.Trim();
        NormalizedName = NormalizeName(name);
        GroupId = groupId;

        _alsoWorks.RemoveAll(alsoWorks => !alsoWorksGroupIds.Contains(alsoWorks.GroupId));
        IEnumerable<GroupId> added = alsoWorksGroupIds.Where(alsoWorksGroupId => _alsoWorks.All(alsoWorks => alsoWorks.GroupId != alsoWorksGroupId));
        _alsoWorks.AddRange([.. added.Select(alsoWorksGroupId => ExerciseAlsoWorks.Create(UserId, Id, alsoWorksGroupId))]);
    }

    public void Delete(DateTimeOffset deletedAtUtc)
    {
        DeletedAtUtc = deletedAtUtc;
    }

    public static string NormalizeName(string name) => name.Trim().ToLowerInvariant();
}
