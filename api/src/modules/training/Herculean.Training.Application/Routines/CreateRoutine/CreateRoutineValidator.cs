using FluentValidation;

namespace Herculean.Training.Application.Routines.CreateRoutine;

internal sealed class CreateRoutineValidator : AbstractValidator<CreateRoutineRequest>
{
    public CreateRoutineValidator()
    {
        this.AddRoutineFieldRules();
    }
}
