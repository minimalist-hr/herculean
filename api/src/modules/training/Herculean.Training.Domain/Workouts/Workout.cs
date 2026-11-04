using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Domain.Workouts;

/// <summary>What the user did on one date.</summary>
internal sealed class Workout : Entity<WorkoutId>
{
    private readonly List<WorkoutExercise> _exercises = [];

    private Workout(WorkoutId id, UserId userId, DateOnly date, WorkoutStatus status, RoutineId? routineId, string name) : base(id)
    {
        UserId = userId;
        Date = date;
        Status = status;
        RoutineId = routineId;
        Name = name;
    }

    public UserId UserId { get; private set; }

    public DateOnly Date { get; private set; }

    public WorkoutStatus Status { get; private set; }

    public RoutineId? RoutineId { get; private set; }

    /// <summary>The routine's name when this was created, so a later rename leaves it alone.</summary>
    public string Name { get; private set; }

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    /// <summary>Its exercises and their targets, copied when it was created, so later routine changes leave it alone.</summary>
    public IReadOnlyList<WorkoutExercise> Exercises => _exercises;

    /// <summary>A skipped workout. Its exercises keep the order they come in.</summary>
    public static Workout Skip(UserId userId, DateOnly date, RoutineId routineId, string name, IEnumerable<RoutineExerciseValues> exercises)
    {
        Workout workout = new(WorkoutId.New(), userId, date, WorkoutStatus.Skipped, routineId, name);
        workout._exercises.AddRange(exercises.Select((values, order) => WorkoutExercise.Create(userId, workout.Id, order, values)));

        return workout;
    }

    public void Delete(DateTimeOffset deletedAtUtc)
    {
        DeletedAtUtc = deletedAtUtc;
    }
}
