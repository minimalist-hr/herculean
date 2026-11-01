using FluentValidation;

namespace Herculean.Training.Application.Exercises.ListExercises;

internal sealed class ListExercisesValidator : AbstractValidator<ListExercisesRequest>
{
    internal const int SearchMaxLength = 100;

    public ListExercisesValidator()
    {
        RuleFor(request => request.Search).MaximumLength(SearchMaxLength);
    }
}
