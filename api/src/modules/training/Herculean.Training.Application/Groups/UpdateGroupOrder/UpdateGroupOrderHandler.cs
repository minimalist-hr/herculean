using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;

namespace Herculean.Training.Application.Groups.UpdateGroupOrder;

internal sealed class UpdateGroupOrderHandler(
    IValidator<UpdateGroupOrderRequest> validator,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<Result> HandleAsync(UpdateGroupOrderRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        List<Group> groups = await groupRepository.ListAsync(cancellationToken);
        Dictionary<Guid, int> orders = request.GroupIds
            .Select((id, order) => (id, order))
            .ToDictionary(item => item.id, item => item.order);
        if (groups.Count != orders.Count || !groups.All(group => orders.ContainsKey(group.Id.Value)))
        {
            return GroupErrors.OrderOutOfDate;
        }

        foreach (Group group in groups)
        {
            group.MoveTo(orders[group.Id.Value]);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
