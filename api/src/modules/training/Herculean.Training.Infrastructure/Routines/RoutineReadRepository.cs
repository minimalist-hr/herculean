using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Infrastructure.WeekPlan;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Routines;

internal sealed class RoutineReadRepository(TrainingDbContext dbContext) : IRoutineReadRepository
{
    public async Task<List<RoutineListItemResponse>> ListAsync(CancellationToken cancellationToken)
    {
        var routines = await dbContext.Routines
            .AsNoTracking()
            .Select(routine => new
            {
                Id = routine.Id.Value,
                routine.Name,
                ExerciseCount = routine.Exercises.Count,
                SetCount = routine.Exercises.Sum(exercise => exercise.TargetSets),
            })
            .ToListAsync(cancellationToken);

        Dictionary<Weekday, PlannedRoutine?> plan = await CurrentWeekPlan.ReadAsync(dbContext, cancellationToken);

        return
        [
            .. routines
                .Select(routine => new RoutineListItemResponse(
                    routine.Id,
                    routine.Name,
                    routine.ExerciseCount,
                    routine.SetCount,
                    [.. plan.Where(day => day.Value?.Id == routine.Id).Select(day => day.Key).Order()]))
                .OrderBy(routine => routine.Weekdays.Count == 0)
                .ThenBy(routine => routine.Weekdays.FirstOrDefault())
                .ThenBy(routine => routine.Name, StringComparer.CurrentCultureIgnoreCase),
        ];
    }
}
