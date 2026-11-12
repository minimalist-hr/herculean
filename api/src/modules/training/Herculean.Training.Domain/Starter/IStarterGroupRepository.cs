namespace Herculean.Training.Domain.Starter;

internal interface IStarterGroupRepository
{
    /// <summary>Every starter group, in order.</summary>
    Task<List<StarterGroup>> ListAsync(CancellationToken cancellationToken);

    Task<StarterGroup?> GetAsync(StarterGroupId id, CancellationToken cancellationToken);

    Task<bool> AllExistAsync(IReadOnlyCollection<StarterGroupId> ids, CancellationToken cancellationToken);

    Task<int> CountAsync(CancellationToken cancellationToken);

    /// <summary>The order after every starter group, so a new one goes last.</summary>
    Task<int> NextOrderAsync(CancellationToken cancellationToken);

    /// <summary>Checks the starter groups for the name, regardless of case.</summary>
    /// <param name="name">The name to look for.</param>
    /// <param name="exceptId">A group to leave out, so one can keep its own name. Null checks them all.</param>
    /// <param name="cancellationToken">Stops the check.</param>
    Task<bool> NameExistsAsync(string name, StarterGroupId? exceptId, CancellationToken cancellationToken);

    /// <summary>Checks whether a starter exercise uses the group, as its group or as "also works".</summary>
    Task<bool> IsInUseAsync(StarterGroupId id, CancellationToken cancellationToken);

    void Add(StarterGroup group);

    void Remove(StarterGroup group);
}
