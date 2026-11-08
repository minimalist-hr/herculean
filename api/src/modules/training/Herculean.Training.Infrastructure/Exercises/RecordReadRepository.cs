using Herculean.Training.Application.Records;
using Herculean.Training.Domain.Exercises;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Exercises;

internal sealed class RecordReadRepository(TrainingDbContext dbContext) : IRecordReadRepository
{
    public async Task<List<HeaviestSession>> ListHeaviestSessionsAsync(CancellationToken cancellationToken)
    {
        Dictionary<ExerciseId, string> names = await dbContext.Exercises
            .AsNoTracking()
            .ToDictionaryAsync(exercise => exercise.Id, exercise => exercise.Name, cancellationToken);
        List<DoneSets.DoneSet> heaviest = await DoneSets.ListHeaviestPerSessionAsync(dbContext, names.Keys, cancellationToken);

        return [.. heaviest.Select(set => new HeaviestSession(set.ExerciseId, names[set.ExerciseId], set.Date, set.WeightKg, set.Reps))];
    }
}
