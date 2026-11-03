using FluentValidation;

namespace Herculean.Training.Application.Days.ListDays;

internal sealed class ListDaysValidator : AbstractValidator<ListDaysRequest>
{
    internal const int MaxDays = 42;

    public ListDaysValidator()
    {
        RuleFor(request => request.To)
            .GreaterThanOrEqualTo(request => request.From)
            .WithMessage("To can't be before from.")
            .LessThan(request => request.From.AddDays(MaxDays))
            .WithMessage($"A request can cover at most {MaxDays} days.");
    }
}
