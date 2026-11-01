using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups.CreateGroup;

internal sealed class CreateGroupHandler(
    IValidator<CreateGroupRequest> validator,
    CurrentUser currentUser,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<GroupResponse>> HandleAsync(CreateGroupRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        if (await groupRepository.NameExistsAsync(request.Name, null, cancellationToken))
        {
            return GroupErrors.NameTaken;
        }

        if (await groupRepository.CountAsync(cancellationToken) >= Group.MaxPerUser)
        {
            return GroupErrors.LimitReached;
        }

        int order = await groupRepository.NextOrderAsync(cancellationToken);
        Group group = Group.Create(currentUser.UserId, request.Name, order);
        groupRepository.Add(group);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new GroupResponse(group.Id.Value, group.Name);
    }
}
