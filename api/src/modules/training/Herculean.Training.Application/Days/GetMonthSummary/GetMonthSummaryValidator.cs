using System.Globalization;

using FluentValidation;

namespace Herculean.Training.Application.Days.GetMonthSummary;

internal sealed class GetMonthSummaryValidator : AbstractValidator<GetMonthSummaryRequest>
{
    internal const string MonthFormat = "yyyy-MM";

    public GetMonthSummaryValidator()
    {
        RuleFor(request => request.Month)
            .Must(month => DateOnly.TryParseExact(month, MonthFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            .WithMessage($"Month must be a valid month, as {MonthFormat}.");
    }
}
