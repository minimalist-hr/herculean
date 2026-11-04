using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Days;

internal interface IDayReadRepository
{
    /// <summary>Every change to the current user's week plan, with its routine even if that was deleted.</summary>
    Task<List<PlanChange>> ListPlanChangesAsync(CancellationToken cancellationToken);

    /// <summary>A routine's exercises in order, even if the routine was deleted.</summary>
    Task<List<DayExerciseResponse>> ListExercisesAsync(RoutineId routineId, CancellationToken cancellationToken);

    /// <summary>The exercises copied into a workout, in order.</summary>
    Task<List<DayExerciseResponse>> ListWorkoutExercisesAsync(WorkoutId workoutId, CancellationToken cancellationToken);

    /// <summary>The current user's workout on a date, or null if there is none.</summary>
    Task<DayWorkout?> GetWorkoutAsync(DateOnly date, CancellationToken cancellationToken);

    /// <summary>The current user's workouts from the first date to the last.</summary>
    Task<List<DayWorkout>> ListWorkoutsAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken);

    /// <summary>Whether the current user has a routine that isn't deleted.</summary>
    Task<bool> HasRoutinesAsync(CancellationToken cancellationToken);
}
