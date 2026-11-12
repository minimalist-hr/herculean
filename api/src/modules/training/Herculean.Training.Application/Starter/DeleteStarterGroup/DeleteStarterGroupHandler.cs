using Herculean.SharedKernel.Results;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Starter;

namespace Herculean.Training.Application.Starter.DeleteStarterGroup;

internal sealed class DeleteStarterGroupHandler(IStarterGroupRepository starterGroupRepository, IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        StarterGroup? group = await starterGroupRepository.GetAsync(StarterGroupId.From(id), cancellationToken);
        if (group is null)
        {
            return StarterErrors.GroupNotFound;
        }

        if (await starterGroupRepository.IsInUseAsync(group.Id, cancellationToken))
        {
            return StarterErrors.GroupInUse;
        }

        starterGroupRepository.Remove(group);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
