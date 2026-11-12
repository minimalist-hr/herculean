using Herculean.SharedKernel.Results;

namespace Herculean.Training.Application.Starter.ListStarterGroups;

internal sealed class ListStarterGroupsHandler(IStarterReadRepository starterReadRepository)
{
    public async Task<Result<List<StarterGroupResponse>>> HandleAsync(CancellationToken cancellationToken) =>
        await starterReadRepository.ListGroupsAsync(cancellationToken);
}
