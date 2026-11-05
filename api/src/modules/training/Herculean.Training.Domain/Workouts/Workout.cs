using Herculean.SharedKernel.Entities;
using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Exercises;
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

    /// <summary>When logging started. Empty when skipped, and on a past day, which has no elapsed time.</summary>
    public DateTimeOffset? StartedAtUtc { get; private set; }

    /// <summary>When logging finished. Empty while in progress and when skipped.</summary>
    public DateTimeOffset? FinishedAtUtc { get; private set; }

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

    /// <summary>A workout in progress. Its exercises keep the order they come in, and their sets start from last time.</summary>
    public static Workout Start(
        UserId userId,
        DateOnly date,
        RoutineId routineId,
        string name,
        IEnumerable<RoutineExerciseValues> exercises,
        IReadOnlyDictionary<ExerciseId, List<SetValues>> lastTime,
        DateTimeOffset? startedAtUtc)
    {
        Workout workout = new(WorkoutId.New(), userId, date, WorkoutStatus.InProgress, routineId, name) { StartedAtUtc = startedAtUtc };
        workout._exercises.AddRange(exercises.Select((values, order) =>
            WorkoutExercise.Start(userId, workout.Id, order, values, lastTime.GetValueOrDefault(values.ExerciseId) ?? [])));

        return workout;
    }

    public Result<Set> AddSet(WorkoutExerciseId exerciseId)
    {
        Result<WorkoutExercise> exercise = FindExerciseToLog(exerciseId);

        return exercise.IsSuccess ? exercise.Value.AddSet() : exercise.Error;
    }

    public Result<Set> RestoreSet(WorkoutExerciseId exerciseId, int order, SetValues values, bool isChecked)
    {
        Result<WorkoutExercise> exercise = FindExerciseToLog(exerciseId);

        return exercise.IsSuccess ? exercise.Value.RestoreSet(order, values, isChecked) : exercise.Error;
    }

    /// <summary>Changes a set and returns its exercise, because later sets can change with it.</summary>
    public Result<WorkoutExercise> UpdateSet(WorkoutExerciseId exerciseId, SetId setId, decimal? weightKg, int? reps, bool? isChecked)
    {
        Result<WorkoutExercise> exercise = FindExerciseToLog(exerciseId);
        if (!exercise.IsSuccess)
        {
            return exercise;
        }

        Result updated = exercise.Value.UpdateSet(setId, weightKg, reps, isChecked);

        return updated.IsSuccess ? exercise : updated.Error;
    }

    public Result DeleteSet(WorkoutExerciseId exerciseId, SetId setId)
    {
        Result<WorkoutExercise> exercise = FindExerciseToLog(exerciseId);

        return exercise.IsSuccess ? exercise.Value.DeleteSet(setId) : exercise.Error;
    }

    public void Delete(DateTimeOffset deletedAtUtc)
    {
        DeletedAtUtc = deletedAtUtc;
    }

    private Result<WorkoutExercise> FindExerciseToLog(WorkoutExerciseId exerciseId)
    {
        if (Status != WorkoutStatus.InProgress)
        {
            return WorkoutErrors.NotInProgress;
        }

        WorkoutExercise? exercise = _exercises.Find(candidate => candidate.Id == exerciseId);

        return exercise is null ? WorkoutErrors.ExerciseNotFound : exercise;
    }
}
