using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.GetRoutine;
using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Domain.Routines;
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
                    WeekdaysOf(routine.Id, plan)))
                .OrderBy(routine => routine.Weekdays.Count == 0)
                .ThenBy(routine => routine.Weekdays.FirstOrDefault())
                .ThenBy(routine => routine.Name, StringComparer.CurrentCultureIgnoreCase),
        ];
    }

    public async Task<RoutineDetailsResponse?> GetAsync(RoutineId id, CancellationToken cancellationToken)
    {
        var routine = await dbContext.Routines
            .AsNoTracking()
            .Where(routine => routine.Id == id)
            .Select(routine => new
            {
                routine.Name,
                Exercises = routine.Exercises
                    .OrderBy(exercise => exercise.Order)
                    .Select(exercise => new RoutineExerciseResponse(
                        exercise.ExerciseId.Value,
                        exercise.Exercise.Name,
                        exercise.TargetSets,
                        exercise.TargetRepsFrom,
                        exercise.TargetRepsTo))
                    .ToList(),
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (routine is null)
        {
            return null;
        }

        Dictionary<Weekday, PlannedRoutine?> plan = await CurrentWeekPlan.ReadAsync(dbContext, cancellationToken);

        return new RoutineDetailsResponse(id.Value, routine.Name, WeekdaysOf(id.Value, plan), routine.Exercises);
    }

    private static List<Weekday> WeekdaysOf(Guid routineId, Dictionary<Weekday, PlannedRoutine?> plan) =>
        [.. plan.Where(day => day.Value?.Id == routineId).Select(day => day.Key).Order()];
}
