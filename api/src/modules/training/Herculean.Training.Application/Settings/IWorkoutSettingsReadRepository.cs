namespace Herculean.Training.Application.Settings;

internal interface IWorkoutSettingsReadRepository
{
    /// <summary>The current user's workout settings, or null if they don't exist yet.</summary>
    Task<WorkoutSettingsResponse?> GetAsync(CancellationToken cancellationToken);
}
