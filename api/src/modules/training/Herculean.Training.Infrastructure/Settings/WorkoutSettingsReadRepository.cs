using Herculean.Training.Application.Settings;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Settings;

internal sealed class WorkoutSettingsReadRepository(TrainingDbContext dbContext) : IWorkoutSettingsReadRepository
{
    public Task<WorkoutSettingsResponse?> GetAsync(CancellationToken cancellationToken) =>
        dbContext.WorkoutSettings
            .AsNoTracking()
            .Select(settings => new WorkoutSettingsResponse(settings.DefaultRestSeconds, settings.RestSound, settings.RestVibrate))
            .SingleOrDefaultAsync(cancellationToken);
}
