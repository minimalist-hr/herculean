using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Starter;

namespace Herculean.Training.Application.Starter.RenameStarterGroup;

internal sealed class RenameStarterGroupHandler(
    IValidator<SaveStarterGroupRequest> validator,
    IStarterGroupRepository starterGroupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(Guid id, SaveStarterGroupRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        StarterGroup? group = await starterGroupRepository.GetAsync(StarterGroupId.From(id), cancellationToken);
        if (group is null)
        {
            return StarterErrors.GroupNotFound;
        }

        if (await starterGroupRepository.NameExistsAsync(request.Name, group.Id, cancellationToken))
        {
            return StarterErrors.GroupNameTaken;
        }

        group.Rename(request.Name);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
