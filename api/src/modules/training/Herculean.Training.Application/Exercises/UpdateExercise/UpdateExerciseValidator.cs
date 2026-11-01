using FluentValidation;

namespace Herculean.Training.Application.Exercises.UpdateExercise;

internal sealed class UpdateExerciseValidator : AbstractValidator<UpdateExerciseRequest>
{
    public UpdateExerciseValidator()
    {
        this.AddExerciseFieldRules();
    }
}
