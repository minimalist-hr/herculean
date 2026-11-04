using Herculean.SharedKernel.Entities;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Domain.Workouts;

/// <summary>An exercise in a workout, with the targets its routine had when the workout was created.</summary>
internal sealed class WorkoutExercise : Entity<WorkoutExerciseId>
{
    private WorkoutExercise(WorkoutExerciseId id, UserId userId, WorkoutId workoutId, ExerciseId exerciseId, int order, int targetSets, int targetRepsFrom, int targetRepsTo) : base(id)
    {
        UserId = userId;
        WorkoutId = workoutId;
        ExerciseId = exerciseId;
        Order = order;
        TargetSets = targetSets;
        TargetRepsFrom = targetRepsFrom;
        TargetRepsTo = targetRepsTo;
    }

    public UserId UserId { get; private set; }

    public WorkoutId WorkoutId { get; private set; }

    public ExerciseId ExerciseId { get; private set; }

    public Exercise Exercise { get; private set; } = null!;

    public int Order { get; private set; }

    public int TargetSets { get; private set; }

    public int TargetRepsFrom { get; private set; }

    public int TargetRepsTo { get; private set; }

    internal static WorkoutExercise Create(UserId userId, WorkoutId workoutId, int order, RoutineExerciseValues values) =>
        new(WorkoutExerciseId.New(), userId, workoutId, values.ExerciseId, order, values.TargetSets, values.TargetRepsFrom, values.TargetRepsTo);
}
