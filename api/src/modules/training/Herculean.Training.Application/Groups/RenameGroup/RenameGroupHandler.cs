using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups.RenameGroup;

internal sealed class RenameGroupHandler(
    IValidator<RenameGroupRequest> validator,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<GroupResponse>> HandleAsync(Guid id, RenameGroupRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        GroupId groupId = GroupId.From(id);
        Group? group = await groupRepository.GetAsync(groupId, cancellationToken);
        if (group is null)
        {
            return GroupErrors.NotFound;
        }

        if (await groupRepository.NameExistsAsync(request.Name, groupId, cancellationToken))
        {
            return GroupErrors.NameTaken;
        }

        group.Rename(request.Name);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new GroupResponse(group.Id.Value, group.Name);
    }
}
