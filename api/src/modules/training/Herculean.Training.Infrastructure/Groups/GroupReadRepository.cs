using Herculean.Training.Application.Groups;
using Herculean.Training.Application.Groups.ListGroups;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.Infrastructure.Groups;

internal sealed class GroupReadRepository(TrainingDbContext dbContext) : IGroupReadRepository
{
    public Task<List<GroupListItemResponse>> ListAsync(CancellationToken cancellationToken) =>
        dbContext.Groups
            .AsNoTracking()
            .OrderBy(group => group.Order)
            .ThenBy(group => group.Name)
            .Select(group => new GroupListItemResponse(
                group.Id.Value,
                group.Name,
                dbContext.Exercises.Count(exercise => exercise.GroupId == group.Id || exercise.AlsoWorks.Any(alsoWorks => alsoWorks.GroupId == group.Id))))
            .ToListAsync(cancellationToken);
}
