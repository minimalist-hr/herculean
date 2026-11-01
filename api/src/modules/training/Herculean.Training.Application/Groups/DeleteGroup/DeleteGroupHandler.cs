using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups.DeleteGroup;

internal sealed class DeleteGroupHandler(
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        GroupId groupId = GroupId.From(id);
        Group? group = await groupRepository.GetAsync(groupId, cancellationToken);
        if (group is null)
        {
            return GroupErrors.NotFound;
        }

        if (await groupRepository.IsInUseAsync(groupId, cancellationToken))
        {
            return GroupErrors.InUse;
        }

        group.Delete(timeProvider.GetUtcNow());
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
