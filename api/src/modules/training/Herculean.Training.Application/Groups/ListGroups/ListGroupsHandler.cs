namespace Herculean.Training.Application.Groups.ListGroups;

internal sealed class ListGroupsHandler(IGroupReadRepository groupReadRepository)
{
    public Task<List<GroupListItemResponse>> HandleAsync(CancellationToken cancellationToken) =>
        groupReadRepository.ListAsync(cancellationToken);
}
