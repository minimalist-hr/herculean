using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.ListExercises;
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

        // The best set comes with workouts, which don't exist yet.
        return await exercises
            .OrderBy(exercise => exercise.Group.Order)
            .ThenBy(exercise => exercise.Name)
            .Select(exercise => new ExerciseListItemResponse(exercise.Id.Value, exercise.Name, exercise.GroupId.Value, exercise.Group.Name, null))
            .ToListAsync(cancellationToken);
    }
}
