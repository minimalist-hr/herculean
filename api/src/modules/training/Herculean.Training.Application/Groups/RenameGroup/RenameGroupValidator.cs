using FluentValidation;

namespace Herculean.Training.Application.Groups.RenameGroup;

internal sealed class RenameGroupValidator : AbstractValidator<RenameGroupRequest>
{
    public RenameGroupValidator()
    {
        this.AddGroupNameRule();
    }
}
