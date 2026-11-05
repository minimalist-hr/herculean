using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Workouts;

/// <summary>Weight and reps for one exercise in a workout.</summary>
internal sealed class Set : Entity<SetId>
{
    internal const decimal MaxWeightKg = 1000;

    internal const int WeightPrecision = 6;

    internal const int WeightScale = 2;

    internal const int MaxReps = 100;

    private Set(SetId id, UserId userId, WorkoutExerciseId workoutExerciseId, int order, decimal weightKg, int reps) : base(id)
    {
        UserId = userId;
        WorkoutExerciseId = workoutExerciseId;
        Order = order;
        WeightKg = weightKg;
        Reps = reps;
    }

    public UserId UserId { get; private set; }

    public WorkoutExerciseId WorkoutExerciseId { get; private set; }

    public int Order { get; private set; }

    public decimal WeightKg { get; private set; }

    public int Reps { get; private set; }

    public bool Checked { get; private set; }

    /// <summary>The weight was changed by hand, so a change on an earlier set leaves it alone.</summary>
    public bool WeightChanged { get; private set; }

    /// <summary>The reps were changed by hand, so a change on an earlier set leaves them alone.</summary>
    public bool RepsChanged { get; private set; }

    internal static Set Create(UserId userId, WorkoutExerciseId workoutExerciseId, int order, SetValues values) =>
        new(SetId.New(), userId, workoutExerciseId, order, values.WeightKg, values.Reps);

    /// <summary>A removed set coming back. Its values count as changed by hand, so a later change can't overwrite them.</summary>
    internal static Set Restore(UserId userId, WorkoutExerciseId workoutExerciseId, int order, SetValues values, bool isChecked)
    {
        Set set = Create(userId, workoutExerciseId, order, values);
        set.Checked = isChecked;
        set.WeightChanged = true;
        set.RepsChanged = true;

        return set;
    }

    /// <summary>Takes new values, when its exercise is swapped.</summary>
    internal void Replace(SetValues values, bool changedByHand)
    {
        WeightKg = values.WeightKg;
        Reps = values.Reps;
        WeightChanged = changedByHand;
        RepsChanged = changedByHand;
    }

    internal void MoveTo(int order)
    {
        Order = order;
    }

    internal void ChangeWeight(decimal weightKg)
    {
        WeightKg = weightKg;
        WeightChanged = true;
    }

    internal void ChangeReps(int reps)
    {
        Reps = reps;
        RepsChanged = true;
    }

    /// <summary>Takes the weight of an earlier set, unless this set is checked or its weight was changed by hand.</summary>
    internal void FollowWeight(decimal weightKg)
    {
        if (!Checked && !WeightChanged)
        {
            WeightKg = weightKg;
        }
    }

    /// <summary>Takes the reps of an earlier set, unless this set is checked or its reps were changed by hand.</summary>
    internal void FollowReps(int reps)
    {
        if (!Checked && !RepsChanged)
        {
            Reps = reps;
        }
    }

    internal void Check(bool isChecked)
    {
        Checked = isChecked;
    }
}
