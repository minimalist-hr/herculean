using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Starter;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Starter;

internal sealed class StarterExerciseRepository(TrainingDbContext dbContext) : IStarterExerciseRepository
{
    public Task<List<StarterExercise>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.StarterExercises
            .Include(exercise => exercise.AlsoWorks)
            .OrderBy(exercise => exercise.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public Task<StarterExercise?> GetAsync(StarterExerciseId id, CancellationToken cancellationToken) =>
        dbContext.StarterExercises
            .Include(exercise => exercise.AlsoWorks)
            .SingleOrDefaultAsync(exercise => exercise.Id == id, cancellationToken);

    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.StarterExercises.CountAsync(cancellationToken);

    public Task<bool> NameExistsAsync(string name, StarterExerciseId? exceptId, CancellationToken cancellationToken)
    {
        string normalizedName = Exercise.NormalizeName(name);

        return dbContext.StarterExercises.AnyAsync(
            exercise => exercise.NormalizedName == normalizedName && exercise.Id != exceptId,
            cancellationToken);
    }

    public void Add(StarterExercise exercise)
    {
        dbContext.StarterExercises.Add(exercise);
    }

    public void Remove(StarterExercise exercise)
    {
        dbContext.StarterExercises.Remove(exercise);
    }
}
