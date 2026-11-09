using FluentValidation;

namespace Herculean.Training.Application.Groups.UpdateGroupOrder;

internal sealed class UpdateGroupOrderValidator : AbstractValidator<UpdateGroupOrderRequest>
{
    public UpdateGroupOrderValidator()
    {
        RuleFor(request => request.GroupIds)
            .Must(groupIds => groupIds is not null && groupIds.Distinct().Count() == groupIds.Count)
            .WithMessage("'{PropertyName}' can’t repeat a group.");
    }
}
