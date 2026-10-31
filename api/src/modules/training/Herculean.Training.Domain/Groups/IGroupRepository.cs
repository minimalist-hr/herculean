namespace Herculean.Training.Domain.Groups;

internal interface IGroupRepository
{
    /// <summary>Counts deleted groups too.</summary>
    Task<bool> AnyForUserAsync(UserId userId, CancellationToken cancellationToken);

    void AddRange(IEnumerable<Group> groups);
}
