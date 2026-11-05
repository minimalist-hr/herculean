using FluentValidation;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.CreateWorkout;

internal sealed class CreateWorkoutValidator : AbstractValidator<CreateWorkoutRequest>
{
    public CreateWorkoutValidator()
    {
        RuleFor(request => request.Date).NotEmpty();
        RuleFor(request => request.Status)
            .IsInEnum()
            .NotEqual(WorkoutStatus.Completed)
            .WithMessage("'{PropertyName}' must be in progress or skipped.");
    }
}
