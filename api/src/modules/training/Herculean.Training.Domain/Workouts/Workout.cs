using Herculean.SharedKernel.Entities;
using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Domain.Workouts;

/// <summary>What the user did on one date.</summary>
internal sealed class Workout : Entity<WorkoutId>
{
    internal const int MinDurationMinutes = 1;

    internal const int MaxDurationMinutes = 600;

    private const int SecondsPerMinute = 60;

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

    /// <summary>How long it took. Set when saved, and can be corrected. Empty on a day logged later without one.</summary>
    public int? DurationSeconds { get; private set; }

    public DateTimeOffset? DeletedAtUtc { get; private set; }

    /// <summary>The routine's target sets when this was created. Saving removes exercises left with no sets, so this keeps what was planned.</summary>
    public int PlannedSets { get; private set; }

    /// <summary>Its exercises and their targets, copied when it was created, so later routine changes leave it alone.</summary>
    public IReadOnlyList<WorkoutExercise> Exercises => _exercises;

    /// <summary>A skipped workout. Its exercises keep the order they come in.</summary>
    public static Workout Skip(UserId userId, DateOnly date, RoutineId routineId, string name, IEnumerable<RoutineExerciseValues> exercises)
    {
        List<RoutineExerciseValues> copied = [.. exercises];
        Workout workout = new(WorkoutId.New(), userId, date, WorkoutStatus.Skipped, routineId, name) { PlannedSets = copied.Sum(values => values.TargetSets) };
        workout._exercises.AddRange(copied.Select((values, order) => WorkoutExercise.Create(userId, workout.Id, order, values)));

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
        List<RoutineExerciseValues> copied = [.. exercises];
        Workout workout = new(WorkoutId.New(), userId, date, WorkoutStatus.InProgress, routineId, name)
        {
            StartedAtUtc = startedAtUtc,
            PlannedSets = copied.Sum(values => values.TargetSets),
        };
        workout._exercises.AddRange(copied.Select((values, order) =>
            WorkoutExercise.Start(userId, workout.Id, order, values, lastTime.GetValueOrDefault(values.ExerciseId) ?? [])));

        return workout;
    }

    /// <summary>Adds exercises at the end, with the starting targets. Their sets start from last time.</summary>
    public Result AddExercises(IReadOnlyList<ExerciseId> exerciseIds, IReadOnlyDictionary<ExerciseId, List<SetValues>> lastTime)
    {
        Result room = CheckRoomFor(exerciseIds);
        if (!room.IsSuccess)
        {
            return room;
        }

        int order = _exercises.Count == 0 ? 0 : _exercises.Max(exercise => exercise.Order) + 1;
        foreach (ExerciseId exerciseId in exerciseIds)
        {
            RoutineExerciseValues values = new(exerciseId, WorkoutExercise.StartingTargetSets, WorkoutExercise.StartingTargetRepsFrom, WorkoutExercise.StartingTargetRepsTo);
            _exercises.Add(WorkoutExercise.Start(UserId, Id, order, values, lastTime.GetValueOrDefault(exerciseId) ?? []));
            order++;
        }

        return Result.Success();
    }

    /// <summary>Puts a removed exercise back where it was, with its sets.</summary>
    public Result RestoreExercise(int order, RoutineExerciseValues values, IReadOnlyList<LoggedSetValues> sets)
    {
        Result room = CheckRoomFor([values.ExerciseId]);
        if (!room.IsSuccess)
        {
            return room;
        }

        int position = Math.Min(order, _exercises.Count);
        foreach (WorkoutExercise later in _exercises.Where(exercise => exercise.Order >= position))
        {
            later.MoveTo(later.Order + 1);
        }

        _exercises.Add(WorkoutExercise.Restore(UserId, Id, position, values, sets));

        return Result.Success();
    }

    /// <summary>Removes an exercise with its sets, and closes the gap.</summary>
    public Result RemoveExercise(WorkoutExerciseId exerciseId)
    {
        Result<WorkoutExercise> exercise = FindExerciseToLog(exerciseId);
        if (!exercise.IsSuccess)
        {
            return exercise;
        }

        _exercises.Remove(exercise.Value);
        foreach (WorkoutExercise later in _exercises.Where(other => other.Order > exercise.Value.Order))
        {
            later.MoveTo(later.Order - 1);
        }

        return Result.Success();
    }

    /// <summary>Swaps an exercise for another, whose last time its sets start from.</summary>
    public Result SwapExercise(WorkoutExerciseId id, ExerciseId exerciseId, IReadOnlyList<SetValues> lastTime)
    {
        Result<WorkoutExercise> exercise = FindExerciseToSwap(id, exerciseId);

        return exercise.IsSuccess ? exercise.Value.Swap(exerciseId, lastTime) : exercise;
    }

    /// <summary>Undoes a swap.</summary>
    public Result SwapExerciseBack(WorkoutExerciseId id, ExerciseId exerciseId, IReadOnlyList<SetValues> values)
    {
        Result<WorkoutExercise> exercise = FindExerciseToSwap(id, exerciseId);

        return exercise.IsSuccess ? exercise.Value.SwapBack(exerciseId, values) : exercise;
    }

    /// <summary>Puts the exercises in this order, which has to name each of them once.</summary>
    public Result ReorderExercises(List<WorkoutExerciseId> order)
    {
        if (Status != WorkoutStatus.InProgress)
        {
            return WorkoutErrors.NotInProgress;
        }

        if (order.Count != _exercises.Count || !_exercises.TrueForAll(exercise => order.Contains(exercise.Id)))
        {
            return WorkoutErrors.OrderOutOfDate;
        }

        foreach (WorkoutExercise exercise in _exercises)
        {
            exercise.MoveTo(order.IndexOf(exercise.Id));
        }

        return Result.Success();
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

    /// <summary>Completes it with only what was done: unchecked sets go, and so does any exercise left with no sets.</summary>
    public Result Finish(DateTimeOffset finishedAtUtc, int? durationMinutes = null)
    {
        if (Status != WorkoutStatus.InProgress)
        {
            return WorkoutErrors.NotInProgress;
        }

        if (!_exercises.Exists(exercise => exercise.Sets.Any(set => set.Checked)))
        {
            return WorkoutErrors.NothingChecked;
        }

        _exercises.ForEach(exercise => exercise.RemoveUncheckedSets());
        _exercises.RemoveAll(exercise => exercise.Sets.Count == 0);
        foreach ((WorkoutExercise exercise, int order) in _exercises.OrderBy(exercise => exercise.Order).Select((exercise, order) => (exercise, order)))
        {
            exercise.MoveTo(order);
        }

        Status = WorkoutStatus.Completed;
        FinishedAtUtc = finishedAtUtc;
        DurationSeconds = StartedAtUtc is DateTimeOffset startedAtUtc ? (int)(finishedAtUtc - startedAtUtc).TotalSeconds : durationMinutes * SecondsPerMinute;

        return Result.Success();
    }

    /// <summary>Corrects a saved workout: its exercises become these, in this order, each with these sets. A new exercise gets the starting targets.</summary>
    public Result Edit(IReadOnlyList<EditedExercise> exercises, int? durationMinutes = null)
    {
        if (Status != WorkoutStatus.Completed)
        {
            return WorkoutErrors.NotCompleted;
        }

        if (exercises.Count == 0)
        {
            return WorkoutErrors.NothingToKeep;
        }

        if (exercises.Count > Routine.MaxExercises)
        {
            return WorkoutErrors.TooManyExercises;
        }

        if (exercises.DistinctBy(exercise => exercise.ExerciseId).Count() != exercises.Count)
        {
            return WorkoutErrors.ExerciseAlreadyIn;
        }

        if (exercises.Any(exercise => exercise.Id is WorkoutExerciseId id && !_exercises.Exists(kept => kept.Id == id)))
        {
            return WorkoutErrors.ExerciseNotFound;
        }

        if (exercises.Any(exercise => exercise.Sets.Count == 0))
        {
            return WorkoutErrors.LastSet;
        }

        if (exercises.Any(exercise => exercise.Sets.Count > WorkoutExercise.MaxSets))
        {
            return WorkoutErrors.TooManySets;
        }

        _exercises.RemoveAll(kept => !exercises.Any(exercise => exercise.Id == kept.Id));
        foreach ((EditedExercise edited, int order) in exercises.Select((edited, order) => (edited, order)))
        {
            WorkoutExercise? kept = _exercises.Find(exercise => exercise.Id == edited.Id);
            if (kept is null)
            {
                RoutineExerciseValues values = new(edited.ExerciseId, WorkoutExercise.StartingTargetSets, WorkoutExercise.StartingTargetRepsFrom, WorkoutExercise.StartingTargetRepsTo);
                _exercises.Add(WorkoutExercise.Restore(UserId, Id, order, values, [.. edited.Sets.Select(set => new LoggedSetValues(set.WeightKg, set.Reps, true))]));
            }
            else
            {
                kept.MoveTo(order);
                kept.ReplaceSets(edited.Sets);
            }
        }

        CorrectDuration(durationMinutes);

        return Result.Success();
    }

    // The form shows whole minutes, so saving the same minutes keeps the exact time.
    private void CorrectDuration(int? durationMinutes)
    {
        int? shownMinutes = DurationSeconds is int seconds ? Math.Max(1, (int)Math.Round(seconds / (double)SecondsPerMinute, MidpointRounding.AwayFromZero)) : null;
        if (durationMinutes != shownMinutes)
        {
            DurationSeconds = durationMinutes * SecondsPerMinute;
        }
    }

    public void Delete(DateTimeOffset deletedAtUtc)
    {
        DeletedAtUtc = deletedAtUtc;
    }

    public void Restore()
    {
        DeletedAtUtc = null;
    }

    private Result CheckRoomFor(IReadOnlyCollection<ExerciseId> exerciseIds)
    {
        if (Status != WorkoutStatus.InProgress)
        {
            return WorkoutErrors.NotInProgress;
        }

        if (_exercises.Count + exerciseIds.Count > Routine.MaxExercises)
        {
            return WorkoutErrors.TooManyExercises;
        }

        return _exercises.Exists(exercise => exerciseIds.Contains(exercise.ExerciseId))
            ? WorkoutErrors.ExerciseAlreadyIn
            : Result.Success();
    }

    private Result<WorkoutExercise> FindExerciseToSwap(WorkoutExerciseId id, ExerciseId exerciseId)
    {
        Result<WorkoutExercise> exercise = FindExerciseToLog(id);
        if (!exercise.IsSuccess)
        {
            return exercise;
        }

        return _exercises.Exists(other => other.ExerciseId == exerciseId) ? WorkoutErrors.ExerciseAlreadyIn : exercise;
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
