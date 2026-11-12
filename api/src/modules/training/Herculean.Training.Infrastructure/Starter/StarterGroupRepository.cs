using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Starter;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Starter;

internal sealed class StarterGroupRepository(TrainingDbContext dbContext) : IStarterGroupRepository
{
    public Task<List<StarterGroup>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.StarterGroups.OrderBy(group => group.Order).ToListAsync(cancellationToken);

    public Task<StarterGroup?> GetAsync(StarterGroupId id, CancellationToken cancellationToken) =>
        dbContext.StarterGroups.SingleOrDefaultAsync(group => group.Id == id, cancellationToken);

    public async Task<bool> AllExistAsync(IReadOnlyCollection<StarterGroupId> ids, CancellationToken cancellationToken)
    {
        int found = await dbContext.StarterGroups.CountAsync(group => ids.Contains(group.Id), cancellationToken);

        return found == ids.Count;
    }

    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.StarterGroups.CountAsync(cancellationToken);

    public async Task<int> NextOrderAsync(CancellationToken cancellationToken)
    {
        int? last = await dbContext.StarterGroups.MaxAsync(group => (int?)group.Order, cancellationToken);

        return (last ?? -1) + 1;
    }

    public Task<bool> NameExistsAsync(string name, StarterGroupId? exceptId, CancellationToken cancellationToken)
    {
        string normalizedName = Group.NormalizeName(name);

        return dbContext.StarterGroups.AnyAsync(
            group => group.NormalizedName == normalizedName && group.Id != exceptId,
            cancellationToken);
    }

    public Task<bool> IsInUseAsync(StarterGroupId id, CancellationToken cancellationToken) =>
        dbContext.StarterExercises.AnyAsync(
            exercise => exercise.GroupId == id || exercise.AlsoWorks.Any(alsoWorks => alsoWorks.GroupId == id),
            cancellationToken);

    public void Add(StarterGroup group)
    {
        dbContext.StarterGroups.Add(group);
    }

    public void Remove(StarterGroup group)
    {
        dbContext.StarterGroups.Remove(group);
    }
}
