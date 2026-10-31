using Herculean.Training.Domain;
using Herculean.Training.Domain.Settings;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Settings;

internal sealed class WorkoutSettingsRepository(TrainingDbContext dbContext) : IWorkoutSettingsRepository
{
    public Task<bool> ExistsForUserAsync(UserId userId, CancellationToken cancellationToken) =>
        dbContext.WorkoutSettings.AnyAsync(workoutSettings => workoutSettings.UserId == userId, cancellationToken);

    public void Add(WorkoutSettings workoutSettings)
    {
        dbContext.WorkoutSettings.Add(workoutSettings);
    }
}
