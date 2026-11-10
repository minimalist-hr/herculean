using Herculean.Training.Application.Export;
using Herculean.Training.Application.Export.GetExport;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Infrastructure.WeekPlan;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Export;

internal sealed class ExportReadRepository(TrainingDbContext dbContext) : IExportReadRepository
{
    public async Task<ExportResponse> GetAsync(CancellationToken cancellationToken)
    {
        // A logged workout keeps an exercise deleted since, so deleted exercises and groups still give their names.
        var groups = await dbContext.Groups
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .AsNoTracking()
            .Select(group => new { group.Id, group.Name, group.Order })
            .ToDictionaryAsync(group => group.Id, cancellationToken);
        var exercises = await dbContext.Exercises
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .AsNoTracking()
            .Select(exercise => new
            {
                exercise.Id,
                exercise.Name,
                exercise.GroupId,
                exercise.DeletedAtUtc,
                AlsoWorks = exercise.AlsoWorks.Select(alsoWorks => alsoWorks.GroupId).ToList(),
            })
            .ToDictionaryAsync(exercise => exercise.Id, cancellationToken);
        var routines = await dbContext.Routines
            .AsNoTracking()
            .OrderBy(routine => routine.Name)
            .Select(routine => new
            {
                routine.Id,
                routine.Name,
                Exercises = routine.Exercises
                    .OrderBy(exercise => exercise.Order)
                    .Select(exercise => new { exercise.ExerciseId, exercise.TargetSets, exercise.TargetRepsFrom, exercise.TargetRepsTo, exercise.SupersetWithNext })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);
        var plan = await CurrentWeekPlan.ReadAsync(dbContext, cancellationToken);
        var workouts = await dbContext.Workouts
            .AsNoTracking()
            .OrderBy(workout => workout.Date)
            .Select(workout => new
            {
                workout.Date,
                workout.Name,
                workout.Status,
                workout.DurationSeconds,
                Exercises = workout.Exercises
                    .OrderBy(exercise => exercise.Order)
                    .Select(exercise => new
                    {
                        exercise.ExerciseId,
                        Sets = exercise.Sets
                            .Where(set => set.Checked)
                            .OrderBy(set => set.Order)
                            .Select(set => new ExportedSet(set.WeightKg, set.Reps))
                            .ToList(),
                    })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);

        string GroupName(GroupId id) => groups.TryGetValue(id, out var group) ? group.Name : string.Empty;
        string ExerciseName(Domain.Exercises.ExerciseId id) => exercises.TryGetValue(id, out var exercise) ? exercise.Name : string.Empty;
        string ExerciseGroup(Domain.Exercises.ExerciseId id) => exercises.TryGetValue(id, out var exercise) ? GroupName(exercise.GroupId) : string.Empty;

        return new ExportResponse(
            [
                .. exercises.Values
                    .Where(exercise => exercise.DeletedAtUtc is null)
                    .OrderBy(exercise => groups.TryGetValue(exercise.GroupId, out var group) ? group.Order : int.MaxValue)
                    .ThenBy(exercise => exercise.Name, StringComparer.OrdinalIgnoreCase)
                    .Select(exercise => new ExportedExercise(exercise.Name, GroupName(exercise.GroupId), [.. exercise.AlsoWorks.Select(GroupName)])),
            ],
            [
                .. routines.Select(routine => new ExportedRoutine(
                    routine.Name,
                    [.. plan.Where(day => day.Value?.Id == routine.Id.Value).Select(day => day.Key).Order()],
                    [.. routine.Exercises.Select(exercise => new ExportedRoutineExercise(ExerciseName(exercise.ExerciseId), exercise.TargetSets, exercise.TargetRepsFrom, exercise.TargetRepsTo, exercise.SupersetWithNext))])),
            ],
            [
                .. workouts.Select(workout => new ExportedWorkout(
                    workout.Date,
                    workout.Name,
                    workout.Status,
                    workout.DurationSeconds,
                    [.. workout.Exercises.Select(exercise => new ExportedWorkoutExercise(ExerciseName(exercise.ExerciseId), ExerciseGroup(exercise.ExerciseId), exercise.Sets))])),
            ]);
    }
}
