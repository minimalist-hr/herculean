using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Domain.Exercises;

internal sealed record StartingExercise(string Name, string Group, string[] AlsoWorks);

internal sealed class Exercise : Entity<ExerciseId>
{
    /// <summary>Common gym exercises, each in a starting group, with the starting groups it also works.</summary>
    internal static readonly StartingExercise[] Starting =
    [
        new("Flat barbell bench press", "Chest", ["Shoulders", "Triceps"]),
        new("Incline dumbbell bench press", "Chest", ["Triceps"]),
        new("Cable crossover", "Chest", []),
        new("Smith machine incline bench press", "Chest", ["Shoulders", "Triceps"]),
        new("Flat dumbbell bench press", "Chest", ["Triceps"]),
        new("Machine crossover", "Chest", []),
        new("Pull-up", "Back", ["Biceps"]),
        new("Machine row", "Back", []),
        new("Lat pulldown", "Back", []),
        new("T-bar row", "Back", []),
        new("Cable row", "Back", []),
        new("Smith machine press", "Shoulders", []),
        new("Dumbbell press", "Shoulders", []),
        new("Lateral dumbbell raise", "Shoulders", []),
        new("Machine press", "Shoulders", []),
        new("Lateral machine raise", "Shoulders", []),
        new("EZ bar curl", "Biceps", []),
        new("Incline dumbbell curl", "Biceps", []),
        new("Barbell curl", "Biceps", []),
        new("Incline hammer curl", "Biceps", []),
        new("EZ bar skullcrusher", "Triceps", []),
        new("Rope pushdown", "Triceps", []),
        new("Parallel bar dips", "Triceps", ["Chest"]),
        new("Straight bar pushdown", "Triceps", []),
        new("Barbell squat", "Legs", []),
        new("Romanian deadlift", "Legs", []),
        new("Leg extension", "Legs", []),
        new("Smith machine calf raise", "Legs", []),
    ];

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

    /// <summary>The exercises a new account starts with, in the starting groups.</summary>
    public static IReadOnlyList<Exercise> CreateStarting(UserId userId, IReadOnlyList<Group> groups)
    {
        Dictionary<string, GroupId> groupIds = groups.ToDictionary(group => group.Name, group => group.Id);

        return [.. Starting.Select(exercise => Create(userId, exercise.Name, groupIds[exercise.Group], exercise.AlsoWorks.Select(name => groupIds[name])))];
    }

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

    public void Restore()
    {
        DeletedAtUtc = null;
    }

    public static string NormalizeName(string name) => name.Trim().ToLowerInvariant();
}
