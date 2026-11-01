using Herculean.Training.Application.Groups.GetGroup;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups;

internal interface IGroupReadRepository
{
    /// <summary>The current user's groups, in their order.</summary>
    Task<List<GroupListItemResponse>> ListAsync(CancellationToken cancellationToken);

    /// <summary>One of the current user's groups with its exercises, or null if there is none.</summary>
    /// <param name="id">The group's ID.</param>
    /// <param name="cancellationToken">Stops the read.</param>
    Task<GroupDetailsResponse?> GetAsync(GroupId id, CancellationToken cancellationToken);
}
