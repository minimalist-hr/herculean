using System.ComponentModel;

using FluentValidation;

using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Routines;
using Herculean.Training.Domain.WeekPlan;

namespace Herculean.Training.Application.Routines;

[Description("An exercise in a routine and its targets.")]
internal sealed record RoutineExerciseItem(
    [property: Description("The exercise.")] Guid ExerciseId,
    [property: Description("The sets to do, 1 to 20.")] int TargetSets,
    [property: Description("The low end of the rep range, 1 to 100.")] int TargetRepsFrom,
    [property: Description("The high end of the rep range, 1 to 100. It can't be below the low end.")] int TargetRepsTo);

/// <summary>The fields a request sends to create or change a routine.</summary>
internal interface IRoutineFields
{
    string Name { get; }

    List<Weekday> Weekdays { get; }

    List<RoutineExerciseItem> Exercises { get; }
}

internal static class RoutineFieldRules
{
    public static List<RoutineExerciseValues> ToExerciseValues(this IRoutineFields fields) =>
    [
        .. fields.Exercises.Select(exercise => new RoutineExerciseValues(
            ExerciseId.From(exercise.ExerciseId),
            exercise.TargetSets,
            exercise.TargetRepsFrom,
            exercise.TargetRepsTo)),
    ];

    public static void AddRoutineFieldRules<T>(this AbstractValidator<T> validator)
        where T : IRoutineFields
    {
        validator.RuleFor(request => request.Name)
            .Must(name => !string.IsNullOrWhiteSpace(name) && name.Trim().Length <= Routine.NameMaxLength)
            .WithMessage($"'{{PropertyName}}' must have 1 to {Routine.NameMaxLength} characters.");
        validator.RuleFor(request => request.Weekdays)
            .NotNull()
            .Must(weekdays => weekdays is null || weekdays.Distinct().Count() == weekdays.Count)
            .WithMessage("'{PropertyName}' can't repeat a weekday.");
        validator.RuleForEach(request => request.Weekdays).IsInEnum();
        validator.RuleFor(request => request.Exercises)
            .Must(exercises => exercises is { Count: > 0 and <= Routine.MaxExercises })
            .WithMessage($"'{{PropertyName}}' must have 1 to {Routine.MaxExercises} exercises.")
            .Must(exercises => exercises is null || exercises.Select(exercise => exercise.ExerciseId).Distinct().Count() == exercises.Count)
            .WithMessage("'{PropertyName}' can't repeat an exercise.");
        validator.RuleForEach(request => request.Exercises).ChildRules(exercise =>
        {
            exercise.RuleFor(item => item.TargetSets).InclusiveBetween(1, Routine.MaxTargetSets);
            exercise.RuleFor(item => item.TargetRepsFrom).InclusiveBetween(1, Routine.MaxTargetReps);
            exercise.RuleFor(item => item.TargetRepsTo)
                .InclusiveBetween(1, Routine.MaxTargetReps)
                .GreaterThanOrEqualTo(item => item.TargetRepsFrom);
        });
    }
}
