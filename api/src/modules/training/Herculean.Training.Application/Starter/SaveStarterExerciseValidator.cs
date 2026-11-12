using FluentValidation;

using Herculean.Training.Application.Exercises;

namespace Herculean.Training.Application.Starter;

internal sealed class SaveStarterExerciseValidator : AbstractValidator<SaveStarterExerciseRequest>
{
    public SaveStarterExerciseValidator()
    {
        this.AddExerciseFieldRules();
    }
}
