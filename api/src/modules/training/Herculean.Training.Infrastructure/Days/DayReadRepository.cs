using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Domain.Routines;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Days;

internal sealed class DayReadRepository(TrainingDbContext dbContext) : IDayReadRepository
{
    public async Task<List<PlanChange>> ListPlanChangesAsync(CancellationToken cancellationToken)
    {
        var changes = await dbContext.WeekPlanDays
            .AsNoTracking()
            .Select(day => new { day.Weekday, day.EffectiveFrom, day.RoutineId })
            .ToListAsync(cancellationToken);
        var routines = await dbContext.Routines
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .AsNoTracking()
            .Select(routine => new { routine.Id, routine.Name, routine.DeletedAtUtc })
            .ToDictionaryAsync(routine => routine.Id, cancellationToken);

        return
        [
            .. changes.Select(change =>
            {
                var routine = change.RoutineId is RoutineId id ? routines[id] : null;

                return new PlanChange(change.Weekday, change.EffectiveFrom, change.RoutineId, routine?.Name, routine?.DeletedAtUtc);
            }),
        ];
    }

    public Task<List<DayExerciseResponse>> ListExercisesAsync(RoutineId routineId, CancellationToken cancellationToken) =>
        dbContext.Set<RoutineExercise>()
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .AsNoTracking()
            .Where(exercise => exercise.RoutineId == routineId)
            .OrderBy(exercise => exercise.Order)
            .Select(exercise => new DayExerciseResponse(
                exercise.ExerciseId.Value,
                exercise.Exercise.Name,
                exercise.Exercise.GroupId.Value,
                exercise.Exercise.Group.Name,
                exercise.TargetSets,
                exercise.TargetRepsFrom,
                exercise.TargetRepsTo))
            .ToListAsync(cancellationToken);

    public Task<bool> HasRoutinesAsync(CancellationToken cancellationToken) =>
        dbContext.Routines.AsNoTracking().AnyAsync(cancellationToken);
}
