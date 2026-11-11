using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Routines;

internal sealed class RoutineExercise : Entity<RoutineExerciseId>
{
    private RoutineExercise(RoutineExerciseId id, UserId userId, RoutineId routineId, ExerciseId exerciseId, int order, int targetSets, int targetRepsFrom, int targetRepsTo, bool supersetWithNext, bool lengthenedPartials) : base(id)
    {
        UserId = userId;
        RoutineId = routineId;
        ExerciseId = exerciseId;
        Order = order;
        TargetSets = targetSets;
        TargetRepsFrom = targetRepsFrom;
        TargetRepsTo = targetRepsTo;
        SupersetWithNext = supersetWithNext;
        LengthenedPartials = lengthenedPartials;
    }

    public UserId UserId { get; private set; }

    public RoutineId RoutineId { get; private set; }

    public ExerciseId ExerciseId { get; private set; }

    public Exercise Exercise { get; private set; } = null!;

    public int Order { get; private set; }

    public int TargetSets { get; private set; }

    public int TargetRepsFrom { get; private set; }

    public int TargetRepsTo { get; private set; }

    /// <summary>Done as a superset with the exercise after it: a set of each, then rest.</summary>
    public bool SupersetWithNext { get; private set; }

    /// <summary>Lengthened partials follow each set: half reps at the stretched end.</summary>
    public bool LengthenedPartials { get; private set; }

    internal void Update(int order, RoutineExerciseValues values)
    {
        Order = order;
        TargetSets = values.TargetSets;
        TargetRepsFrom = values.TargetRepsFrom;
        TargetRepsTo = values.TargetRepsTo;
        SupersetWithNext = values.SupersetWithNext;
        LengthenedPartials = values.LengthenedPartials;
    }

    internal static RoutineExercise Create(UserId userId, RoutineId routineId, int order, RoutineExerciseValues values) =>
        new(RoutineExerciseId.New(), userId, routineId, values.ExerciseId, order, values.TargetSets, values.TargetRepsFrom, values.TargetRepsTo, values.SupersetWithNext, values.LengthenedPartials);
}
