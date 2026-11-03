using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Domain.Routines;

internal sealed class RoutineExercise : Entity<RoutineExerciseId>
{
    private RoutineExercise(RoutineExerciseId id, UserId userId, RoutineId routineId, ExerciseId exerciseId, int order, int targetSets, int targetRepsFrom, int targetRepsTo) : base(id)
    {
        UserId = userId;
        RoutineId = routineId;
        ExerciseId = exerciseId;
        Order = order;
        TargetSets = targetSets;
        TargetRepsFrom = targetRepsFrom;
        TargetRepsTo = targetRepsTo;
    }

    public UserId UserId { get; private set; }

    public RoutineId RoutineId { get; private set; }

    public ExerciseId ExerciseId { get; private set; }

    public Exercise Exercise { get; private set; } = null!;

    public int Order { get; private set; }

    public int TargetSets { get; private set; }

    public int TargetRepsFrom { get; private set; }

    public int TargetRepsTo { get; private set; }

    internal void Update(int order, RoutineExerciseValues values)
    {
        Order = order;
        TargetSets = values.TargetSets;
        TargetRepsFrom = values.TargetRepsFrom;
        TargetRepsTo = values.TargetRepsTo;
    }

    internal static RoutineExercise Create(UserId userId, RoutineId routineId, int order, RoutineExerciseValues values) =>
        new(RoutineExerciseId.New(), userId, routineId, values.ExerciseId, order, values.TargetSets, values.TargetRepsFrom, values.TargetRepsTo);
}
