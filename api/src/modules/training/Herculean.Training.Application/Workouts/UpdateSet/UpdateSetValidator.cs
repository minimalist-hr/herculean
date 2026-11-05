using FluentValidation;

namespace Herculean.Training.Application.Workouts.UpdateSet;

internal sealed class UpdateSetValidator : AbstractValidator<UpdateSetRequest>
{
    public UpdateSetValidator()
    {
        RuleFor(request => request.WeightKg).IsSetWeight();
        RuleFor(request => request.Reps).IsSetReps();
    }
}
