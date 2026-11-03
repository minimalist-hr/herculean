using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Routines;

internal sealed class Routine : Entity<RoutineId>
{
    internal const int NameMaxLength = 100;

    /// <summary>Keeps the routine list small enough to load whole.</summary>
    internal const int MaxPerUser = 50;

    internal const int MaxExercises = 30;

    internal const int MaxTargetSets = 20;

    internal const int MaxTargetReps = 100;

    private readonly List<RoutineExercise> _exercises = [];

    private Routine(RoutineId id, UserId userId, string name, string normalizedName) : base(id)
    {
        UserId = userId;
        Name = name;
        NormalizedName = normalizedName;
    }

    public UserId UserId { get; private set; }

    public string Name { get; private set; }

    /// <summary>For finding the name regardless of case. See <see cref="NormalizeName"/>.</summary>
    public string NormalizedName { get; private set; }

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    public IReadOnlyList<RoutineExercise> Exercises => _exercises;

    /// <summary>A new routine. Its exercises keep the order they come in.</summary>
    public static Routine Create(UserId userId, string name, IEnumerable<RoutineExerciseValues> exercises)
    {
        Routine routine = new(RoutineId.New(), userId, name.Trim(), NormalizeName(name));
        routine._exercises.AddRange(exercises.Select((values, order) => RoutineExercise.Create(userId, routine.Id, order, values)));

        return routine;
    }

    /// <summary>Replaces the name and exercises. An exercise that stays keeps its row.</summary>
    public void Update(string name, IReadOnlyList<RoutineExerciseValues> exercises)
    {
        Name = name.Trim();
        NormalizedName = NormalizeName(name);

        _exercises.RemoveAll(exercise => exercises.All(values => values.ExerciseId != exercise.ExerciseId));
        foreach ((RoutineExerciseValues values, int order) in exercises.Select((values, order) => (values, order)))
        {
            RoutineExercise? existing = _exercises.Find(exercise => exercise.ExerciseId == values.ExerciseId);
            if (existing is null)
            {
                _exercises.Add(RoutineExercise.Create(UserId, Id, order, values));
            }
            else
            {
                existing.Update(order, values);
            }
        }

        _exercises.Sort((first, second) => first.Order.CompareTo(second.Order));
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
