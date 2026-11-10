using Herculean.Training.Application.Routines;
using Herculean.Training.Application.Routines.GetRoutine;
using Herculean.Training.Application.Routines.ListRoutines;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;
using Herculean.Training.Domain.Workouts;
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

        var lastDone = await dbContext.Workouts
            .AsNoTracking()
            .Where(workout => workout.Status == WorkoutStatus.Completed && workout.RoutineId != null)
            .GroupBy(workout => workout.RoutineId)
            .Select(workouts => new { RoutineId = workouts.Key, Date = workouts.Max(workout => workout.Date) })
            .ToListAsync(cancellationToken);
        Dictionary<Guid, DateOnly> lastDoneOn = lastDone.ToDictionary(done => done.RoutineId!.Value.Value, done => done.Date);

        return
        [
            .. routines
                .Select(routine => new RoutineListItemResponse(
                    routine.Id,
                    routine.Name,
                    routine.ExerciseCount,
                    routine.SetCount,
                    WeekdaysOf(routine.Id, plan),
                    lastDoneOn.TryGetValue(routine.Id, out DateOnly date) ? date : null))
                .OrderBy(routine => routine.Weekdays.Count == 0)
                .ThenBy(routine => routine.Weekdays.FirstOrDefault())
                .ThenBy(routine => routine.Name, StringComparer.CurrentCultureIgnoreCase),
        ];
    }

    public Task<Dictionary<RoutineId, string>> ListNamesAsync(CancellationToken cancellationToken) =>
        dbContext.Routines
            .AsNoTracking()
            .ToDictionaryAsync(routine => routine.Id, routine => routine.Name, cancellationToken);

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
                        exercise.Exercise.GroupId.Value,
                        exercise.Exercise.Group.Name,
                        exercise.TargetSets,
                        exercise.TargetRepsFrom,
                        exercise.TargetRepsTo,
                        exercise.SupersetWithNext))
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
