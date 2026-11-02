using Herculean.Training.Domain.Exercises;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Exercises;

internal sealed class ExerciseRepository(TrainingDbContext dbContext) : IExerciseRepository
{
    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.Exercises.CountAsync(cancellationToken);

    public Task<Exercise?> GetAsync(ExerciseId id, CancellationToken cancellationToken) =>
        dbContext.Exercises
            .Include(exercise => exercise.AlsoWorks)
            .SingleOrDefaultAsync(exercise => exercise.Id == id, cancellationToken);

    public Task<bool> NameExistsAsync(string name, ExerciseId? exceptId, CancellationToken cancellationToken)
    {
        string normalizedName = Exercise.NormalizeName(name);

        return dbContext.Exercises.AnyAsync(
            exercise => exercise.NormalizedName == normalizedName && exercise.Id != exceptId,
            cancellationToken);
    }

    public async Task<bool> AllExistAsync(IReadOnlyCollection<ExerciseId> ids, CancellationToken cancellationToken)
    {
        int found = await dbContext.Exercises.CountAsync(exercise => ids.Contains(exercise.Id), cancellationToken);

        return found == ids.Count;
    }

    public void Add(Exercise exercise)
    {
        dbContext.Exercises.Add(exercise);
    }
}
