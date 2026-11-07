using System.Globalization;

using FluentValidation;

namespace Herculean.Training.Application.Exercises.ListExerciseSessions;

internal sealed class ListExerciseSessionsValidator : AbstractValidator<ListExerciseSessionsRequest>
{
    // A day has at most one workout, so the last session's date marks where the next page starts.
    internal const string CursorFormat = "yyyy-MM-dd";

    public ListExerciseSessionsValidator()
    {
        RuleFor(request => request.Cursor)
            .Must(cursor => cursor is null || TryParseCursor(cursor, out _))
            .WithMessage("Cursor must be a nextCursor from an earlier page.");
    }

    internal static bool TryParseCursor(string cursor, out DateOnly before) =>
        DateOnly.TryParseExact(cursor, CursorFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out before);
}
