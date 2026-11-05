using FluentValidation;

namespace Herculean.Training.Application.Workouts.AddSet;

internal sealed class AddSetValidator : AbstractValidator<AddSetRequest>
{
    public AddSetValidator()
    {
        When(request => request.Removed is not null, () =>
        {
            RuleFor(request => request.Removed!.Order).GreaterThanOrEqualTo(0);
            RuleFor(request => request.Removed!.WeightKg).IsSetWeight();
            RuleFor(request => request.Removed!.Reps).IsSetReps();
        });
    }
}
