using FluentValidation;

namespace Herculean.Training.Application.Groups.CreateGroup;

internal sealed class CreateGroupValidator : AbstractValidator<CreateGroupRequest>
{
    public CreateGroupValidator()
    {
        this.AddGroupNameRule();
    }
}
