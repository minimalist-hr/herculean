using FluentValidation;

namespace Herculean.Training.Application.Exercises.CreateExercise;

internal sealed class CreateExerciseValidator : AbstractValidator<CreateExerciseRequest>
{
    public CreateExerciseValidator()
    {
        this.AddExerciseFieldRules();
    }
}
