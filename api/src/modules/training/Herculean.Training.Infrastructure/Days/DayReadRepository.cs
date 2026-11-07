using Herculean.Training.Application.Days;
using Herculean.Training.Application.Days.GetDay;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

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

    public Task<List<DayExerciseResponse>> ListWorkoutExercisesAsync(WorkoutId workoutId, CancellationToken cancellationToken) =>
        dbContext.Set<WorkoutExercise>()
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .AsNoTracking()
            .Where(exercise => exercise.WorkoutId == workoutId)
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

    public Task<DayWorkout?> GetWorkoutAsync(DateOnly date, CancellationToken cancellationToken) =>
        dbContext.Workouts
            .AsNoTracking()
            .Where(workout => workout.Date == date)
            .Select(workout => new DayWorkout(workout.Id.Value, workout.Date, workout.Status, workout.Name, workout.RoutineId))
            .SingleOrDefaultAsync(cancellationToken);

    public Task<List<DayWorkout>> ListWorkoutsAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken) =>
        dbContext.Workouts
            .AsNoTracking()
            .Where(workout => workout.Date >= from && workout.Date <= to)
            .Select(workout => new DayWorkout(workout.Id.Value, workout.Date, workout.Status, workout.Name, workout.RoutineId))
            .ToListAsync(cancellationToken);

    public Task<List<DoneWorkoutTotals>> ListDoneWorkoutTotalsAsync(DateOnly from, DateOnly to, CancellationToken cancellationToken) =>
        dbContext.Workouts
            .AsNoTracking()
            .Where(workout => workout.Status == WorkoutStatus.Completed && workout.Date >= from && workout.Date <= to)
            .Select(workout => new DoneWorkoutTotals(
                workout.Date,
                workout.StartedAtUtc,
                workout.FinishedAtUtc,
                workout.PlannedSets,
                workout.Exercises.SelectMany(exercise => exercise.Sets).Count(set => set.Checked),
                workout.Exercises.SelectMany(exercise => exercise.Sets).Where(set => set.Checked).Sum(set => set.WeightKg * set.Reps)))
            .ToListAsync(cancellationToken);

    public Task<DateOnly?> GetFirstWorkoutDateAsync(CancellationToken cancellationToken) =>
        dbContext.Workouts
            .AsNoTracking()
            .MinAsync(workout => (DateOnly?)workout.Date, cancellationToken);

    public Task<bool> HasRoutinesAsync(CancellationToken cancellationToken) =>
        dbContext.Routines.AsNoTracking().AnyAsync(cancellationToken);
}
