using Herculean.SharedKernel.Results;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups.GetGroup;

internal sealed class GetGroupHandler(IGroupReadRepository groupReadRepository)
{
    public async Task<Result<GroupDetailsResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        GroupDetailsResponse? group = await groupReadRepository.GetAsync(GroupId.From(id), cancellationToken);

        return group is null ? GroupErrors.NotFound : group;
    }
}
