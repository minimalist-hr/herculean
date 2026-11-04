namespace Herculean.Training.Domain.Workouts;

internal interface IWorkoutRepository
{
    /// <summary>One of the current user's workouts, or null if there is none.</summary>
    Task<Workout?> GetAsync(WorkoutId id, CancellationToken cancellationToken);

    /// <summary>Checks whether the current user has a workout on this date.</summary>
    Task<bool> ExistsOnAsync(DateOnly date, CancellationToken cancellationToken);

    void Add(Workout workout);
}
