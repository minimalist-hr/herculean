using FluentValidation;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.SwapWorkoutExercise;

internal sealed class SwapWorkoutExerciseValidator : AbstractValidator<SwapWorkoutExerciseRequest>
{
    public SwapWorkoutExerciseValidator()
    {
        RuleFor(request => request.ExerciseId).NotEmpty();
        When(request => request.Sets is not null, () =>
        {
            RuleFor(request => request.Sets)
                .Must(sets => sets is { Count: > 0 and <= WorkoutExercise.MaxSets })
                .WithMessage($"'{{PropertyName}}' must have 1 to {WorkoutExercise.MaxSets} sets.");
            RuleForEach(request => request.Sets).ChildRules(set =>
            {
                set.RuleFor(item => item.WeightKg).IsSetWeight();
                set.RuleFor(item => item.Reps).IsSetReps();
            });
        });
    }
}
