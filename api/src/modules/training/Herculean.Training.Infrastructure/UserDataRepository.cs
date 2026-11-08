using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure;

internal sealed class UserDataRepository(TrainingDbContext dbContext) : IUserDataRepository
{
    public async Task RemoveAllAsync(UserId userId, CancellationToken cancellationToken)
    {
        await RemoveAsync(dbContext.Set<Set>().Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Set<WorkoutExercise>().Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Workouts.Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.WeekPlanDays.Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Set<RoutineExercise>().Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Routines.Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Set<ExerciseAlsoWorks>().Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Exercises.Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.Groups.Where(row => row.UserId == userId), cancellationToken);
        await RemoveAsync(dbContext.WorkoutSettings.Where(row => row.UserId == userId), cancellationToken);
    }

    private async Task RemoveAsync<TRow>(IQueryable<TRow> rows, CancellationToken cancellationToken)
        where TRow : class
    {
        // Runs with no signed-in user, and soft-deleted rows have to go too.
        List<TRow> found = await rows.IgnoreQueryFilters().ToListAsync(cancellationToken);
        dbContext.RemoveRange(found);
    }
}
