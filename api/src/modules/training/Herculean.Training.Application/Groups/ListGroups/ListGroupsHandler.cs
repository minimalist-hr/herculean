namespace Herculean.Training.Application.Groups.ListGroups;

internal sealed class ListGroupsHandler(IGroupReadRepository groupReadRepository)
{
    public Task<List<GroupResponse>> HandleAsync(CancellationToken cancellationToken) =>
        groupReadRepository.ListAsync(cancellationToken);
}
