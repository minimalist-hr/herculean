using Herculean.SharedKernel.Entities;
using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Domain.Workouts;

/// <summary>An exercise in a workout, with the targets its routine had when the workout was created.</summary>
internal sealed class WorkoutExercise : Entity<WorkoutExerciseId>
{
    internal const int MaxSets = 20;

    internal const int StartingTargetSets = 3;

    internal const int StartingTargetRepsFrom = 8;

    internal const int StartingTargetRepsTo = 10;

    private readonly List<Set> _sets = [];

    private WorkoutExercise(WorkoutExerciseId id, UserId userId, WorkoutId workoutId, ExerciseId exerciseId, int order, int targetSets, int targetRepsFrom, int targetRepsTo, bool supersetWithNext) : base(id)
    {
        UserId = userId;
        WorkoutId = workoutId;
        ExerciseId = exerciseId;
        Order = order;
        TargetSets = targetSets;
        TargetRepsFrom = targetRepsFrom;
        TargetRepsTo = targetRepsTo;
        SupersetWithNext = supersetWithNext;
    }

    public UserId UserId { get; private set; }

    public WorkoutId WorkoutId { get; private set; }

    public ExerciseId ExerciseId { get; private set; }

    public Exercise Exercise { get; private set; } = null!;

    public int Order { get; private set; }

    public int TargetSets { get; private set; }

    public int TargetRepsFrom { get; private set; }

    public int TargetRepsTo { get; private set; }

    /// <summary>Done as a superset with the exercise after it: a set of each, then rest.</summary>
    public bool SupersetWithNext { get; private set; }

    /// <summary>Its sets, in order.</summary>
    public IReadOnlyList<Set> Sets => [.. _sets.OrderBy(set => set.Order)];

    internal static WorkoutExercise Create(UserId userId, WorkoutId workoutId, int order, RoutineExerciseValues values) =>
        new(WorkoutExerciseId.New(), userId, workoutId, values.ExerciseId, order, values.TargetSets, values.TargetRepsFrom, values.TargetRepsTo, values.SupersetWithNext);

    /// <summary>An exercise of a workout being started. Each set starts with the same set last time, or the last one if last time had fewer. With no last time, it starts at 0 kg and the low end of the target reps.</summary>
    internal static WorkoutExercise Start(UserId userId, WorkoutId workoutId, int order, RoutineExerciseValues values, IReadOnlyList<SetValues> lastTime)
    {
        WorkoutExercise exercise = Create(userId, workoutId, order, values);
        exercise._sets.AddRange(Enumerable.Range(0, values.TargetSets).Select(index =>
            Set.Create(userId, exercise.Id, index, StartingValues(index, values.TargetRepsFrom, lastTime))));

        return exercise;
    }

    /// <summary>A removed exercise coming back with its sets.</summary>
    internal static WorkoutExercise Restore(UserId userId, WorkoutId workoutId, int order, RoutineExerciseValues values, IEnumerable<LoggedSetValues> sets)
    {
        WorkoutExercise exercise = Create(userId, workoutId, order, values);
        exercise._sets.AddRange(sets.Select((set, index) =>
            Set.Restore(userId, exercise.Id, index, new SetValues(set.WeightKg, set.Reps), set.Checked)));

        return exercise;
    }

    private static SetValues StartingValues(int index, int targetRepsFrom, IReadOnlyList<SetValues> lastTime) =>
        lastTime.Count == 0 ? new SetValues(0, targetRepsFrom) : lastTime[Math.Min(index, lastTime.Count - 1)];

    internal void MoveTo(int order)
    {
        Order = order;
    }

    internal void JoinNext()
    {
        SupersetWithNext = true;
    }

    internal void EndSuperset()
    {
        SupersetWithNext = false;
    }

    /// <summary>Becomes another exercise, keeping its set count and targets. Its sets start from that exercise's last time.</summary>
    internal Result Swap(ExerciseId exerciseId, IReadOnlyList<SetValues> lastTime)
    {
        if (_sets.Exists(set => set.Checked))
        {
            return WorkoutErrors.ExerciseHasCheckedSets;
        }

        ExerciseId = exerciseId;
        foreach ((Set set, int index) in Sets.Select((set, index) => (set, index)))
        {
            set.Replace(StartingValues(index, TargetRepsFrom, lastTime), changedByHand: false);
        }

        return Result.Success();
    }

    /// <summary>Undoes a swap: it becomes the exercise it was, with the values it had.</summary>
    internal Result SwapBack(ExerciseId exerciseId, IReadOnlyList<SetValues> values)
    {
        if (_sets.Exists(set => set.Checked))
        {
            return WorkoutErrors.ExerciseHasCheckedSets;
        }

        ExerciseId = exerciseId;
        foreach ((Set set, int index) in Sets.Select((set, index) => (set, index)))
        {
            set.Replace(values[Math.Min(index, values.Count - 1)], changedByHand: true);
        }

        return Result.Success();
    }

    /// <summary>Takes these sets in place of its own, all checked, as a saved workout's are.</summary>
    internal void ReplaceSets(IReadOnlyList<SetValues> sets)
    {
        _sets.Clear();
        _sets.AddRange(sets.Select((values, order) => Set.Restore(UserId, Id, order, values, isChecked: true)));
    }

    /// <summary>Removes the sets that weren't checked, and closes the gaps.</summary>
    internal void RemoveUncheckedSets()
    {
        _sets.RemoveAll(set => !set.Checked);
        foreach ((Set set, int order) in Sets.Select((set, order) => (set, order)))
        {
            set.MoveTo(order);
        }
    }

    /// <summary>Adds a copy of the last set.</summary>
    internal Result<Set> AddSet()
    {
        if (_sets.Count >= MaxSets)
        {
            return WorkoutErrors.TooManySets;
        }

        Set last = Sets[^1];
        Set set = Set.Create(UserId, Id, last.Order + 1, new SetValues(last.WeightKg, last.Reps));
        _sets.Add(set);

        return set;
    }

    /// <summary>Puts a removed set back where it was.</summary>
    internal Result<Set> RestoreSet(int order, SetValues values, bool isChecked)
    {
        if (_sets.Count >= MaxSets)
        {
            return WorkoutErrors.TooManySets;
        }

        int position = Math.Min(order, _sets.Count);
        foreach (Set later in _sets.Where(set => set.Order >= position))
        {
            later.MoveTo(later.Order + 1);
        }

        Set restored = Set.Restore(UserId, Id, position, values, isChecked);
        _sets.Add(restored);

        return restored;
    }

    /// <summary>Changes a set. A changed value carries down to the later sets that follow it.</summary>
    internal Result UpdateSet(SetId id, decimal? weightKg, int? reps, bool? isChecked)
    {
        Set? set = _sets.Find(candidate => candidate.Id == id);
        if (set is null)
        {
            return WorkoutErrors.SetNotFound;
        }

        List<Set> later = [.. _sets.Where(other => other.Order > set.Order)];
        if (weightKg is decimal newWeightKg && newWeightKg != set.WeightKg)
        {
            set.ChangeWeight(newWeightKg);
            later.ForEach(other => other.FollowWeight(newWeightKg));
        }

        if (reps is int newReps && newReps != set.Reps)
        {
            set.ChangeReps(newReps);
            later.ForEach(other => other.FollowReps(newReps));
        }

        if (isChecked is bool check)
        {
            set.Check(check);
        }

        return Result.Success();
    }

    /// <summary>Removes a set and closes the gap. The last set stays, because an exercise is removed as a whole.</summary>
    internal Result DeleteSet(SetId id)
    {
        Set? set = _sets.Find(candidate => candidate.Id == id);
        if (set is null)
        {
            return WorkoutErrors.SetNotFound;
        }

        if (_sets.Count == 1)
        {
            return WorkoutErrors.LastSet;
        }

        _sets.Remove(set);
        foreach (Set later in _sets.Where(other => other.Order > set.Order))
        {
            later.MoveTo(later.Order - 1);
        }

        return Result.Success();
    }
}
