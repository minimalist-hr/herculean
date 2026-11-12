using Herculean.Training.Application.Starter;
using Herculean.Training.Application.Starter.ListStarterExercises;
using Herculean.Training.Application.Starter.ListStarterGroups;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Starter;

internal sealed class StarterReadRepository(TrainingDbContext dbContext) : IStarterReadRepository
{
    public Task<List<StarterGroupResponse>> ListGroupsAsync(CancellationToken cancellationToken) =>
        dbContext.StarterGroups
            .AsNoTracking()
            .OrderBy(group => group.Order)
            .Select(group => new StarterGroupResponse(
                group.Id.Value,
                group.Name,
                dbContext.StarterExercises.Count(exercise => exercise.GroupId == group.Id)))
            .ToListAsync(cancellationToken);

    public Task<List<StarterExerciseResponse>> ListExercisesAsync(CancellationToken cancellationToken) =>
        dbContext.StarterExercises
            .AsNoTracking()
            .OrderBy(exercise => exercise.CreatedAtUtc)
            .Select(exercise => new StarterExerciseResponse(
                exercise.Id.Value,
                exercise.Name,
                exercise.GroupId.Value,
                exercise.AlsoWorks.Select(alsoWorks => alsoWorks.GroupId.Value).ToList()))
            .ToListAsync(cancellationToken);
}
