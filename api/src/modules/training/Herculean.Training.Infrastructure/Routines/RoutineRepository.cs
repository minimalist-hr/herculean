using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Routines;

internal sealed class RoutineRepository(TrainingDbContext dbContext) : IRoutineRepository
{
    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.Routines.CountAsync(cancellationToken);

    public Task<bool> NameExistsAsync(string name, CancellationToken cancellationToken)
    {
        string normalizedName = Routine.NormalizeName(name);

        return dbContext.Routines.AnyAsync(routine => routine.NormalizedName == normalizedName, cancellationToken);
    }

    public async Task RemoveExerciseAsync(ExerciseId exerciseId, CancellationToken cancellationToken)
    {
        List<RoutineExercise> uses = await dbContext.Set<RoutineExercise>()
            .Where(exercise => exercise.ExerciseId == exerciseId)
            .ToListAsync(cancellationToken);

        dbContext.Set<RoutineExercise>().RemoveRange(uses);
    }

    public void Add(Routine routine)
    {
        dbContext.Routines.Add(routine);
    }
}
