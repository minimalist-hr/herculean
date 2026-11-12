using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Starter;

namespace Herculean.Training.Application.Starter.CreateStarterGroup;

internal sealed class CreateStarterGroupHandler(
    IValidator<SaveStarterGroupRequest> validator,
    IStarterGroupRepository starterGroupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result<StarterCreatedResponse>> HandleAsync(SaveStarterGroupRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        if (await starterGroupRepository.CountAsync(cancellationToken) >= Group.MaxPerUser)
        {
            return StarterErrors.GroupLimitReached;
        }

        if (await starterGroupRepository.NameExistsAsync(request.Name, null, cancellationToken))
        {
            return StarterErrors.GroupNameTaken;
        }

        StarterGroup group = StarterGroup.Create(request.Name, await starterGroupRepository.NextOrderAsync(cancellationToken));
        starterGroupRepository.Add(group);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new StarterCreatedResponse(group.Id.Value);
    }
}
