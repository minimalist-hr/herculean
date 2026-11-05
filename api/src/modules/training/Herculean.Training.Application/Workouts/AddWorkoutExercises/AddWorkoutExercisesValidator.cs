using FluentValidation;

using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.AddWorkoutExercises;

internal sealed class AddWorkoutExercisesValidator : AbstractValidator<AddWorkoutExercisesRequest>
{
    public AddWorkoutExercisesValidator()
    {
        RuleFor(request => request)
            .Must(request => request.ExerciseIds is null != request.Removed is null)
            .WithMessage("Send either the exercises to add or the removed one to put back.");
        When(request => request.ExerciseIds is not null, () =>
        {
            RuleFor(request => request.ExerciseIds)
                .Must(ids => ids is { Count: > 0 and <= Routine.MaxExercises })
                .WithMessage($"'{{PropertyName}}' must have 1 to {Routine.MaxExercises} exercises.")
                .Must(ids => ids is null || ids.Distinct().Count() == ids.Count)
                .WithMessage("'{PropertyName}' can't repeat an exercise.");
        });
        When(request => request.Removed is not null, () =>
        {
            RuleFor(request => request.Removed!.Order).GreaterThanOrEqualTo(0);
            RuleFor(request => request.Removed!.TargetSets).InclusiveBetween(1, Routine.MaxTargetSets);
            RuleFor(request => request.Removed!.TargetRepsFrom).InclusiveBetween(1, Routine.MaxTargetReps);
            RuleFor(request => request.Removed!.TargetRepsTo)
                .InclusiveBetween(1, Routine.MaxTargetReps)
                .GreaterThanOrEqualTo(request => request.Removed!.TargetRepsFrom);
            RuleFor(request => request.Removed!.Sets)
                .Must(sets => sets is { Count: > 0 and <= WorkoutExercise.MaxSets })
                .WithMessage($"'{{PropertyName}}' must have 1 to {WorkoutExercise.MaxSets} sets.");
            RuleForEach(request => request.Removed!.Sets).ChildRules(set =>
            {
                set.RuleFor(item => item.WeightKg).IsSetWeight();
                set.RuleFor(item => item.Reps).IsSetReps();
            });
        });
    }
}
