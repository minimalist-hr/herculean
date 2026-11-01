namespace Herculean.Training.Domain.Groups;

internal interface IGroupRepository
{
    /// <summary>Counts deleted groups too.</summary>
    Task<bool> AnyForUserAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>The IDs of the current user's groups.</summary>
    Task<List<GroupId>> ListIdsAsync(CancellationToken cancellationToken);

    void AddRange(IEnumerable<Group> groups);
}
