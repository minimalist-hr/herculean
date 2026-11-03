using FluentValidation;

namespace Herculean.Training.Application.Routines.UpdateRoutine;

internal sealed class UpdateRoutineValidator : AbstractValidator<UpdateRoutineRequest>
{
    public UpdateRoutineValidator()
    {
        this.AddRoutineFieldRules();
    }
}
