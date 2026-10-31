namespace Herculean.Training.Domain.Settings;

internal interface IWorkoutSettingsRepository
{
    Task<WorkoutSettings?> GetForUserAsync(UserId userId, CancellationToken cancellationToken);

    Task<bool> ExistsForUserAsync(UserId userId, CancellationToken cancellationToken);

    void Add(WorkoutSettings workoutSettings);
}
