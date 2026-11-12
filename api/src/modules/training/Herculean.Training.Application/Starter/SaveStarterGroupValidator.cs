using FluentValidation;

using Herculean.Training.Application.Groups;

namespace Herculean.Training.Application.Starter;

internal sealed class SaveStarterGroupValidator : AbstractValidator<SaveStarterGroupRequest>
{
    public SaveStarterGroupValidator()
    {
        this.AddGroupNameRule();
    }
}
