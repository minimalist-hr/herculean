using FluentValidation;

using Herculean.Training.Domain.Routines;

namespace Herculean.Training.Application.Workouts;

internal static class WorkoutNameRule
{
    /// <summary>A new name for a workout, like a routine's: 1 to 100 characters once trimmed. Null keeps the name it has.</summary>
    public static IRuleBuilderOptions<T, string?> IsWorkoutName<T>(this IRuleBuilder<T, string?> rule) =>
        rule.Must(name => name is null || (!string.IsNullOrWhiteSpace(name) && name.Trim().Length <= Routine.NameMaxLength))
            .WithMessage($"'{{PropertyName}}' must have 1 to {Routine.NameMaxLength} characters.");
}
