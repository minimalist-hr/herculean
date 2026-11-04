using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Workouts;

internal sealed class WorkoutRepository(TrainingDbContext dbContext) : IWorkoutRepository
{
    public Task<Workout?> GetAsync(WorkoutId id, CancellationToken cancellationToken) =>
        dbContext.Workouts.SingleOrDefaultAsync(workout => workout.Id == id, cancellationToken);

    public Task<bool> ExistsOnAsync(DateOnly date, CancellationToken cancellationToken) =>
        dbContext.Workouts.AnyAsync(workout => workout.Date == date, cancellationToken);

    public void Add(Workout workout)
    {
        dbContext.Workouts.Add(workout);
    }
}
