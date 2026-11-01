namespace Herculean.Training.Domain.Groups;

internal interface IGroupRepository
{
    /// <summary>Counts deleted groups too.</summary>
    Task<bool> AnyForUserAsync(UserId userId, CancellationToken cancellationToken);

    /// <summary>The IDs of the current user's groups.</summary>
    Task<List<GroupId>> ListIdsAsync(CancellationToken cancellationToken);

    /// <summary>The current user's groups.</summary>
    Task<List<Group>> ListAsync(CancellationToken cancellationToken);

    /// <summary>One of the current user's groups, or null if there is none.</summary>
    Task<Group?> GetAsync(GroupId id, CancellationToken cancellationToken);

    /// <summary>One of the current user's deleted groups, or null if there is none.</summary>
    Task<Group?> GetDeletedAsync(GroupId id, CancellationToken cancellationToken);

    /// <summary>Counts the current user's groups.</summary>
    Task<int> CountAsync(CancellationToken cancellationToken);

    /// <summary>The order after all the current user's groups, deleted ones too, so a restored group never lands after a new one by chance.</summary>
    Task<int> NextOrderAsync(CancellationToken cancellationToken);

    /// <summary>Checks the current user's groups for the name, regardless of case.</summary>
    /// <param name="name">The name to look for.</param>
    /// <param name="exceptId">A group to leave out, so one can keep its own name. Null checks them all.</param>
    /// <param name="cancellationToken">Stops the check.</param>
    Task<bool> NameExistsAsync(string name, GroupId? exceptId, CancellationToken cancellationToken);

    /// <summary>Checks whether an exercise uses the group, as its group or as "also works".</summary>
    Task<bool> IsInUseAsync(GroupId id, CancellationToken cancellationToken);

    void Add(Group group);

    void AddRange(IEnumerable<Group> groups);
}
