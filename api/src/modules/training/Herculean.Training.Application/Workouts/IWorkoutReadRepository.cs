using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts;

internal interface IWorkoutReadRepository
{
    /// <summary>One of the current user's workouts with its exercises, sets and last time, or null if there is none.</summary>
    Task<WorkoutDetailsResponse?> GetAsync(WorkoutId id, CancellationToken cancellationToken);

    /// <summary>A routine's exercises in order, even if the routine was deleted, leaving out exercises deleted since.</summary>
    Task<List<RoutineExerciseValues>> ListRoutineExercisesAsync(RoutineId routineId, CancellationToken cancellationToken);

    /// <summary>Each exercise's sets in its latest completed workout before a date. An exercise never done has no entry.</summary>
    Task<Dictionary<ExerciseId, LastTimeResponse>> ListLastTimeAsync(List<ExerciseId> exerciseIds, DateOnly before, CancellationToken cancellationToken);
}
