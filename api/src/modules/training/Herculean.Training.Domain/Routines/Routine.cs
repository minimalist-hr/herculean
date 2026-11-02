using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Routines;

internal sealed class Routine : Entity<RoutineId>
{
    internal const int NameMaxLength = 100;

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

    public static string NormalizeName(string name) => name.Trim().ToLowerInvariant();
}
