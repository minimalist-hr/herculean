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
        RuleFor(request => request.RoutineId)
            .Null()
            .When(request => request.Status != WorkoutStatus.InProgress)
            .WithMessage("'{PropertyName}' can only be given when starting a workout.");
    }
}
