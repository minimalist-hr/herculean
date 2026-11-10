using FluentValidation;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.UpdateWorkout;

internal sealed class UpdateWorkoutValidator : AbstractValidator<UpdateWorkoutRequest>
{
    public UpdateWorkoutValidator()
    {
        RuleFor(request => request.Status)
            .Equal(WorkoutStatus.Completed)
            .WithMessage("'{PropertyName}' must be completed.");
        RuleFor(request => request.DurationMinutes).InclusiveBetween(Workout.MinDurationMinutes, Workout.MaxDurationMinutes);
    }
}
