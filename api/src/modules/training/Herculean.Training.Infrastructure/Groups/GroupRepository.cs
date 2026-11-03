using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Groups;

internal sealed class GroupRepository(TrainingDbContext dbContext) : IGroupRepository
{
    public Task<bool> AnyForUserAsync(UserId userId, CancellationToken cancellationToken) =>
        dbContext.Groups
            .IgnoreQueryFilters([TrainingDbContext.UserFilter, TrainingDbContext.SoftDeleteFilter])
            .AnyAsync(group => group.UserId == userId, cancellationToken);

    public async Task<bool> AllExistAsync(IReadOnlyCollection<GroupId> ids, CancellationToken cancellationToken)
    {
        int found = await dbContext.Groups.CountAsync(group => ids.Contains(group.Id), cancellationToken);

        return found == ids.Count;
    }

    public Task<List<Group>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.Groups.ToListAsync(cancellationToken);

    public Task<Group?> GetAsync(GroupId id, CancellationToken cancellationToken) =>
        dbContext.Groups.SingleOrDefaultAsync(group => group.Id == id, cancellationToken);

    public Task<Group?> GetDeletedAsync(GroupId id, CancellationToken cancellationToken) =>
        dbContext.Groups
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .SingleOrDefaultAsync(group => group.Id == id && group.DeletedAtUtc != null, cancellationToken);

    public Task<int> CountAsync(CancellationToken cancellationToken) =>
        dbContext.Groups.CountAsync(cancellationToken);

    public async Task<int> NextOrderAsync(CancellationToken cancellationToken)
    {
        int? last = await dbContext.Groups
            .IgnoreQueryFilters([TrainingDbContext.SoftDeleteFilter])
            .MaxAsync(group => (int?)group.Order, cancellationToken);

        return (last ?? -1) + 1;
    }

    public Task<bool> NameExistsAsync(string name, GroupId? exceptId, CancellationToken cancellationToken)
    {
        string normalizedName = Group.NormalizeName(name);

        return dbContext.Groups.AnyAsync(
            group => group.NormalizedName == normalizedName && group.Id != exceptId,
            cancellationToken);
    }

    public Task<bool> IsInUseAsync(GroupId id, CancellationToken cancellationToken) =>
        dbContext.Exercises.AnyAsync(
            exercise => exercise.GroupId == id || exercise.AlsoWorks.Any(alsoWorks => alsoWorks.GroupId == id),
            cancellationToken);

    public void Add(Group group)
    {
        dbContext.Groups.Add(group);
    }

    public void AddRange(IEnumerable<Group> groups)
    {
        dbContext.Groups.AddRange(groups);
    }
}
