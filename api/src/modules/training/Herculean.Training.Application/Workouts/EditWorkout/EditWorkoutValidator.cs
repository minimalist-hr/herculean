using FluentValidation;

using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.EditWorkout;

internal sealed class EditWorkoutValidator : AbstractValidator<EditWorkoutRequest>
{
    public EditWorkoutValidator()
    {
        RuleFor(request => request.Exercises)
            .Must(exercises => exercises is { Count: > 0 and <= Routine.MaxExercises })
            .WithMessage($"'{{PropertyName}}' must have 1 to {Routine.MaxExercises} exercises.")
            .Must(exercises => exercises is null || exercises.DistinctBy(exercise => exercise.ExerciseId).Count() == exercises.Count)
            .WithMessage("'{PropertyName}' can’t repeat an exercise.");
        RuleFor(request => request.DurationMinutes).InclusiveBetween(Workout.MinDurationMinutes, Workout.MaxDurationMinutes);
        RuleForEach(request => request.Exercises).ChildRules(exercise =>
        {
            exercise.RuleFor(item => item.Sets)
                .Must(sets => sets is { Count: > 0 and <= WorkoutExercise.MaxSets })
                .WithMessage($"'{{PropertyName}}' must have 1 to {WorkoutExercise.MaxSets} sets.");
            exercise.RuleForEach(item => item.Sets).ChildRules(set =>
            {
                set.RuleFor(item => item.WeightKg).IsSetWeight();
                set.RuleFor(item => item.Reps).IsSetReps();
            });
        });
    }
}
