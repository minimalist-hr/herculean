using FluentValidation;

namespace Herculean.Training.Application.Workouts.CreateWorkout;

internal sealed class CreateWorkoutValidator : AbstractValidator<CreateWorkoutRequest>
{
    public CreateWorkoutValidator()
    {
        RuleFor(request => request.Date).NotEmpty();
        RuleFor(request => request.Status).IsInEnum();
    }
}
