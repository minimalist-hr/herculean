using Herculean.Training.Application.Stats;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Stats;

/// <summary>Counts every user's workouts, so the user filter is off. Deleted workouts stay out.</summary>
internal sealed class TrainingStatsReadRepository(TrainingDbContext dbContext) : ITrainingStatsReadRepository
{
    public Task<List<FinishedWorkout>> ListFinishedSinceAsync(DateTimeOffset since, CancellationToken cancellationToken) =>
        dbContext.Workouts
            .IgnoreQueryFilters([TrainingDbContext.UserFilter])
            .AsNoTracking()
            .Where(workout => workout.Status == WorkoutStatus.Completed && workout.FinishedAtUtc >= since)
            .Select(workout => new FinishedWorkout(workout.UserId.Value, workout.FinishedAtUtc!.Value))
            .ToListAsync(cancellationToken);
}
