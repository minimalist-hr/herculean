using FluentValidation;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseOrder;

internal sealed class UpdateWorkoutExerciseOrderValidator : AbstractValidator<UpdateWorkoutExerciseOrderRequest>
{
    public UpdateWorkoutExerciseOrderValidator()
    {
        RuleFor(request => request.WorkoutExerciseIds)
            .Must(ids => ids is not null && ids.Distinct().Count() == ids.Count)
            .WithMessage("'{PropertyName}' can't repeat an exercise.");
    }
}
