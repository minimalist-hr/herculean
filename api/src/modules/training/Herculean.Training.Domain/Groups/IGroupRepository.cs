namespace Herculean.Training.Domain.Groups;

internal interface IGroupRepository
{
    void AddRange(IEnumerable<Group> groups);
}
