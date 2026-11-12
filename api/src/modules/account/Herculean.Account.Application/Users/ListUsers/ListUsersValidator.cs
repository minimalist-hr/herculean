using System.Globalization;

using FluentValidation;

namespace Herculean.Account.Application.Users.ListUsers;

internal sealed class ListUsersValidator : AbstractValidator<ListUsersRequest>
{
    internal const int SearchMaxLength = 100;

    public ListUsersValidator()
    {
        RuleFor(request => request.Search)
            .MaximumLength(SearchMaxLength);

        RuleFor(request => request.Cursor)
            .Must(cursor => cursor is null || TryParseCursor(cursor, out _))
            .WithMessage("Cursor must be a nextCursor from an earlier page.");
    }

    // The last row's sort time: when it signed up, or when it gets deleted.
    internal static string FormatCursor(DateTimeOffset value) => value.ToString("O", CultureInfo.InvariantCulture);

    internal static bool TryParseCursor(string cursor, out DateTimeOffset after) =>
        DateTimeOffset.TryParseExact(cursor, "O", CultureInfo.InvariantCulture, DateTimeStyles.None, out after);
}
