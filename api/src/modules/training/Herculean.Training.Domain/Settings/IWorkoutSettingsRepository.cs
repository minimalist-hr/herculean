namespace Herculean.Training.Domain.Settings;

internal interface IWorkoutSettingsRepository
{
    Task<bool> ExistsForUserAsync(UserId userId, CancellationToken cancellationToken);

    void Add(WorkoutSettings workoutSettings);
}
