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

    public Task<List<GroupId>> ListIdsAsync(CancellationToken cancellationToken) =>
        dbContext.Groups.Select(group => group.Id).ToListAsync(cancellationToken);

    public void AddRange(IEnumerable<Group> groups)
    {
        dbContext.Groups.AddRange(groups);
    }
}
