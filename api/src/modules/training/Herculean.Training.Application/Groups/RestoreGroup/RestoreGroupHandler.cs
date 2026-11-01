using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups.RestoreGroup;

internal sealed class RestoreGroupHandler(
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<GroupResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        GroupId groupId = GroupId.From(id);
        Group? group = await groupRepository.GetDeletedAsync(groupId, cancellationToken);
        if (group is null)
        {
            return GroupErrors.NotFound;
        }

        if (await groupRepository.NameExistsAsync(group.Name, groupId, cancellationToken))
        {
            return GroupErrors.NameTaken;
        }

        group.Restore();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new GroupResponse(group.Id.Value, group.Name);
    }
}
