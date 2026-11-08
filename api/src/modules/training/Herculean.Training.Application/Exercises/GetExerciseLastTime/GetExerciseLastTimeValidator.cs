using FluentValidation;

namespace Herculean.Training.Application.Exercises.GetExerciseLastTime;

internal sealed class GetExerciseLastTimeValidator : AbstractValidator<GetExerciseLastTimeRequest>
{
    public GetExerciseLastTimeValidator()
    {
        RuleFor(request => request.Before)
            .NotEmpty()
            .WithMessage("Before is required.");
    }
}
