using Herculean.Training.Application.Groups.ListGroups;

namespace Herculean.Training.Application.Groups;

internal interface IGroupReadRepository
{
    /// <summary>The current user's groups, in their order.</summary>
    Task<List<GroupResponse>> ListAsync(CancellationToken cancellationToken);
}
