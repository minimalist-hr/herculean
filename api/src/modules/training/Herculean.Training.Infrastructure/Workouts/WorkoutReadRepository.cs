using Herculean.Training.Application.Workouts;
using Herculean.Training.Application.Workouts.GetWorkout;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Workouts;

internal sealed class WorkoutReadRepository(TrainingDbContext dbContext) : IWorkoutReadRepository
{
    public Task<List<WorkoutResponse>> ListAsync(WorkoutStatus status, CancellationToken cancellationToken) =>
        dbContext.Workouts
            .AsNoTracking()
            .Where(workout => workout.Status == status)
            .OrderByDescending(workout => workout.Date)
            .Select(workout => new WorkoutResponse(workout.Id.Value, workout.Date, workout.Status, workout.Name))
            .ToListAsync(cancellationToken);

    public async Task<WorkoutDetailsResponse?> GetAsync(WorkoutId id, CancellationToken cancellationToken)
    {
        var workout = await dbContext.Workouts
            .AsNoTracking()
            .Where(workout => workout.Id == id)
            .Select(workout => new { workout.Date, workout.Status, workout.Name, workout.StartedAtUtc, workout.FinishedAtUtc })
            .SingleOrDefaultAsync(cancellationToken);
        if (workout is null)
        {
            return null;
        }

        var exercises = await dbContext.Set<WorkoutExercise>()
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .AsNoTracking()
            .Where(exercise => exercise.WorkoutId == id)
            .OrderBy(exercise => exercise.Order)
            .Select(exercise => new
            {
                exercise.Id,
                exercise.ExerciseId,
                exercise.Exercise.Name,
                exercise.Exercise.GroupId,
                GroupName = exercise.Exercise.Group.Name,
                exercise.TargetSets,
                exercise.TargetRepsFrom,
                exercise.TargetRepsTo,
                Sets = exercise.Sets
                    .OrderBy(set => set.Order)
                    .Select(set => new SetResponse(set.Id.Value, set.Order, set.WeightKg, set.Reps, set.Checked))
                    .ToList(),
            })
            .ToListAsync(cancellationToken);
        Dictionary<ExerciseId, LastTimeResponse> lastTime = await ListLastTimeAsync([.. exercises.Select(exercise => exercise.ExerciseId)], workout.Date, cancellationToken);

        return new WorkoutDetailsResponse(
            id.Value,
            workout.Date,
            workout.Status,
            workout.Name,
            workout.StartedAtUtc,
            [
                .. exercises.Select(exercise => new WorkoutExerciseResponse(
                    exercise.Id.Value,
                    exercise.ExerciseId.Value,
                    exercise.Name,
                    exercise.GroupId.Value,
                    exercise.GroupName,
                    exercise.TargetSets,
                    exercise.TargetRepsFrom,
                    exercise.TargetRepsTo,
                    exercise.Sets,
                    lastTime.GetValueOrDefault(exercise.ExerciseId))),
            ],
            workout.FinishedAtUtc);
    }

    public Task<List<RoutineExerciseValues>> ListRoutineExercisesAsync(RoutineId routineId, CancellationToken cancellationToken) =>
        dbContext.Set<RoutineExercise>()
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .AsNoTracking()
            .Where(exercise => exercise.RoutineId == routineId && exercise.Exercise.DeletedAtUtc == null)
            .OrderBy(exercise => exercise.Order)
            .Select(exercise => new RoutineExerciseValues(exercise.ExerciseId, exercise.TargetSets, exercise.TargetRepsFrom, exercise.TargetRepsTo))
            .ToListAsync(cancellationToken);

    public Task<List<EarlierMostReps>> ListEarlierMostRepsAsync(List<ExerciseId> exerciseIds, DateOnly before, CancellationToken cancellationToken) =>
        dbContext.Set<WorkoutExercise>()
            .AsNoTracking()
            .Where(exercise => exerciseIds.Contains(exercise.ExerciseId))
            .Join(
                dbContext.Workouts.Where(workout => workout.Status == WorkoutStatus.Completed && workout.Date < before),
                exercise => exercise.WorkoutId,
                workout => workout.Id,
                (exercise, workout) => exercise)
            .SelectMany(exercise => exercise.Sets.Where(set => set.Checked), (exercise, set) => new { exercise.ExerciseId, set.WeightKg, set.Reps })
            .GroupBy(set => new { set.ExerciseId, set.WeightKg })
            .Select(sets => new EarlierMostReps(sets.Key.ExerciseId, sets.Key.WeightKg, sets.Max(set => set.Reps)))
            .ToListAsync(cancellationToken);

    public async Task<Dictionary<ExerciseId, LastTimeResponse>> ListLastTimeAsync(List<ExerciseId> exerciseIds, DateOnly before, CancellationToken cancellationToken)
    {
        var latest = await dbContext.Set<WorkoutExercise>()
            .AsNoTracking()
            .Where(exercise => exerciseIds.Contains(exercise.ExerciseId) && exercise.Sets.Any())
            .Join(
                dbContext.Workouts.Where(workout => workout.Status == WorkoutStatus.Completed && workout.Date < before),
                exercise => exercise.WorkoutId,
                workout => workout.Id,
                (exercise, workout) => new { exercise.Id, exercise.ExerciseId, workout.Date })
            .GroupBy(done => done.ExerciseId)
            .Select(times => times.OrderByDescending(done => done.Date).First())
            .ToListAsync(cancellationToken);

        List<WorkoutExerciseId> ids = [.. latest.Select(done => done.Id)];
        var sets = await dbContext.Set<Set>()
            .AsNoTracking()
            .Where(set => ids.Contains(set.WorkoutExerciseId))
            .OrderBy(set => set.Order)
            .Select(set => new { set.WorkoutExerciseId, set.WeightKg, set.Reps })
            .ToListAsync(cancellationToken);

        return latest.ToDictionary(
            done => done.ExerciseId,
            done => new LastTimeResponse(
                done.Date,
                [.. sets.Where(set => set.WorkoutExerciseId == done.Id).Select(set => new LastTimeSetResponse(set.WeightKg, set.Reps))]));
    }
}
