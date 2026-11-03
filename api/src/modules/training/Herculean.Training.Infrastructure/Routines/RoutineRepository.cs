using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Routines;

internal sealed class RoutineRepository(TrainingDbContext dbContext) : IRoutineRepository
{
    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.Routines.CountAsync(cancellationToken);

    public Task<Routine?> GetAsync(RoutineId id, CancellationToken cancellationToken) =>
        dbContext.Routines
            .Include(routine => routine.Exercises)
            .SingleOrDefaultAsync(routine => routine.Id == id, cancellationToken);

    public Task<Routine?> GetDeletedAsync(RoutineId id, CancellationToken cancellationToken) =>
        dbContext.Routines
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .Include(routine => routine.Exercises)
            .SingleOrDefaultAsync(routine => routine.Id == id && routine.DeletedAtUtc != null, cancellationToken);

    public Task<bool> NameExistsAsync(string name, RoutineId? exceptId, CancellationToken cancellationToken)
    {
        string normalizedName = Routine.NormalizeName(name);

        return dbContext.Routines.AnyAsync(
            routine => routine.NormalizedName == normalizedName && routine.Id != exceptId,
            cancellationToken);
    }

    public Task<bool> UsesExerciseAsync(ExerciseId exerciseId, CancellationToken cancellationToken) =>
        dbContext.Routines.AnyAsync(routine => routine.Exercises.Any(exercise => exercise.ExerciseId == exerciseId), cancellationToken);

    public void Add(Routine routine)
    {
        dbContext.Routines.Add(routine);
    }
}
