using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Routines;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;

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
