using Herculean.Training.Application.Groups;
using Herculean.Training.Application.Groups.ListGroups;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Groups;

internal sealed class GroupReadRepository(TrainingDbContext dbContext) : IGroupReadRepository
{
    public Task<List<GroupResponse>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.Groups
            .AsNoTracking()
            .OrderBy(group => group.Order)
            .Select(group => new GroupResponse(group.Id.Value, group.Name))
            .ToListAsync(cancellationToken);
}
