using Herculean.Training.Domain.Exercises;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Exercises;

internal sealed class ExerciseRepository(TrainingDbContext dbContext) : IExerciseRepository
{
    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.Exercises.CountAsync(cancellationToken);

    public Task<bool> NameExistsAsync(string name, CancellationToken cancellationToken)
    {
        string normalizedName = Exercise.NormalizeName(name);

        return dbContext.Exercises.AnyAsync(exercise => exercise.NormalizedName == normalizedName, cancellationToken);
    }

    public void Add(Exercise exercise)
    {
        dbContext.Exercises.Add(exercise);
    }
}
