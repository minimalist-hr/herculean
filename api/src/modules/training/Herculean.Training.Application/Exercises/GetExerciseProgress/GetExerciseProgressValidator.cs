using FluentValidation;

namespace Herculean.Training.Application.Exercises.GetExerciseProgress;

internal sealed class GetExerciseProgressValidator : AbstractValidator<GetExerciseProgressRequest>
{
    // How many months each range reaches back. All has no limit.
    private static readonly Dictionary<string, int?> Months = new()
    {
        ["3m"] = 3,
        ["6m"] = 6,
        ["1y"] = 12,
        ["all"] = null,
    };

    public GetExerciseProgressValidator()
    {
        RuleFor(request => request.Range)
            .Must(Months.ContainsKey)
            .WithMessage("Range must be 3m, 6m, 1y or all.");
    }

    /// <summary>The first date a range reads from, or null for all of them.</summary>
    internal static DateOnly? FromOf(string range, DateOnly today) =>
        Months[range] is int months ? today.AddMonths(-months) : null;
}
