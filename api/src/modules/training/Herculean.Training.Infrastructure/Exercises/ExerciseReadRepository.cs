using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.GetExerciseProgress;
using Herculean.Training.Application.Exercises.ListExerciseSessions;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Routines;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Workouts;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Exercises;

internal sealed class ExerciseReadRepository(TrainingDbContext dbContext) : IExerciseReadRepository
{
    public async Task<List<ExerciseListItemResponse>> ListAsync(string? search, GroupId? groupId, CancellationToken cancellationToken)
    {
        IQueryable<Exercise> exercises = dbContext.Exercises.AsNoTracking();

        if (search is not null)
        {
            string normalizedSearch = Exercise.NormalizeName(search);
            exercises = exercises.Where(exercise => exercise.NormalizedName.Contains(normalizedSearch));
        }

        if (groupId is GroupId id)
        {
            exercises = exercises.Where(exercise => exercise.GroupId == id);
        }

        List<ExerciseListItemResponse> read = await exercises
            .OrderBy(exercise => exercise.Group.Order)
            .ThenBy(exercise => exercise.Name)
            .Select(exercise => new ExerciseListItemResponse(exercise.Id.Value, exercise.Name, exercise.GroupId.Value, exercise.Group.Name, null))
            .ToListAsync(cancellationToken);

        return await DoneSets.WithBestSetsAsync(dbContext, read, cancellationToken);
    }

    public async Task<ExerciseDetailsResponse?> GetAsync(ExerciseId id, CancellationToken cancellationToken)
    {
        ExerciseDetailsResponse? exercise = await GetWithoutProgressAsync(id, cancellationToken);
        if (exercise is null)
        {
            return null;
        }

        List<DateOnly> times = await DoneSets.ListWorkoutDatesAsync(dbContext, id, cancellationToken);
        Dictionary<ExerciseId, BestSetResponse> best = await DoneSets.ListBestAsync(dbContext, [id], cancellationToken);

        return exercise with
        {
            BestSet = best.GetValueOrDefault(id),
            TimesDone = times.Count,
            FirstDoneOn = times.Count == 0 ? null : times.Min(),
        };
    }

    public Task<bool> ExistsAsync(ExerciseId id, CancellationToken cancellationToken) =>
        dbContext.Exercises.AsNoTracking().AnyAsync(exercise => exercise.Id == id, cancellationToken);

    public async Task<List<ExerciseSessionResponse>> ListSessionsAsync(ExerciseId id, DateOnly? before, int take, CancellationToken cancellationToken)
    {
        var sessions = await dbContext.Set<WorkoutExercise>()
            .AsNoTracking()
            .Where(exercise => exercise.ExerciseId == id && exercise.Sets.Any(set => set.Checked))
            .Join(
                dbContext.Workouts.Where(workout => workout.Status == WorkoutStatus.Completed && (before == null || workout.Date < before)),
                exercise => exercise.WorkoutId,
                workout => workout.Id,
                (exercise, workout) => new { exercise.Id, WorkoutId = workout.Id, workout.Date, workout.Name })
            .OrderByDescending(session => session.Date)
            .Take(take)
            .ToListAsync(cancellationToken);

        List<WorkoutExerciseId> ids = [.. sessions.Select(session => session.Id)];
        var sets = await dbContext.Set<Set>()
            .AsNoTracking()
            .Where(set => ids.Contains(set.WorkoutExerciseId) && set.Checked)
            .OrderBy(set => set.Order)
            .Select(set => new { set.WorkoutExerciseId, set.WeightKg, set.Reps })
            .ToListAsync(cancellationToken);

        return
        [
            .. sessions.Select(session => new ExerciseSessionResponse(
                session.WorkoutId.Value,
                session.Date,
                session.Name,
                [.. sets.Where(set => set.WorkoutExerciseId == session.Id).Select(set => new SessionSetResponse(set.WeightKg, set.Reps))])),
        ];
    }

    public async Task<List<SessionMonthResponse>> ListSessionMonthsAsync(ExerciseId id, DateOnly from, DateOnly to, CancellationToken cancellationToken)
    {
        List<DoneSets.SessionMonth> months = await DoneSets.ListMonthsAsync(dbContext, id, from, to, cancellationToken);

        return
        [
            .. months
                .OrderByDescending(month => month.Year)
                .ThenByDescending(month => month.Month)
                .Select(month => new SessionMonthResponse($"{month.Year:D4}-{month.Month:D2}", month.Sessions)),
        ];
    }

    public async Task<List<ProgressPointResponse>> ListHeaviestSetsAsync(ExerciseId id, DateOnly? from, CancellationToken cancellationToken)
    {
        List<DoneSets.DoneSet> heaviest = await DoneSets.ListHeaviestPerSessionAsync(dbContext, id, from, cancellationToken);

        return [.. heaviest.OrderBy(set => set.Date).Select(set => new ProgressPointResponse(set.Date, set.WeightKg, set.Reps))];
    }

    private Task<ExerciseDetailsResponse?> GetWithoutProgressAsync(ExerciseId id, CancellationToken cancellationToken) =>
        dbContext.Exercises
            .AsNoTracking()
            .Where(exercise => exercise.Id == id)
            .Select(exercise => new ExerciseDetailsResponse(
                exercise.Id.Value,
                exercise.Name,
                new GroupResponse(exercise.GroupId.Value, exercise.Group.Name),
                exercise.AlsoWorks
                    .OrderBy(alsoWorks => alsoWorks.Group.Order)
                    .Select(alsoWorks => new GroupResponse(alsoWorks.GroupId.Value, alsoWorks.Group.Name))
                    .ToList(),
                dbContext.Routines
                    .Where(routine => routine.Exercises.Any(routineExercise => routineExercise.ExerciseId == id))
                    .OrderBy(routine => routine.Name)
                    .Select(routine => new RoutineResponse(routine.Id.Value, routine.Name))
                    .ToList(),
                null,
                0,
                null))
            .SingleOrDefaultAsync(cancellationToken);
}
