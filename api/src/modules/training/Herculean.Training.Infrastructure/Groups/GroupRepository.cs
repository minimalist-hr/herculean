using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Infrastructure.Groups;

internal sealed class GroupRepository(TrainingDbContext dbContext) : IGroupRepository
{
    public void AddRange(IEnumerable<Group> groups)
    {
        dbContext.Groups.AddRange(groups);
    }
}
