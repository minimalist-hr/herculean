using FluentValidation;
using FluentValidation.Results;

using Herculean.SharedKernel.Results;
using Herculean.SharedKernel.Validation;

namespace Herculean.Account.Application.Users.ListUsers;

internal sealed class ListUsersHandler(IValidator<ListUsersRequest> validator, IUserReadRepository userReadRepository)
{
    internal const int PageSize = 20;

    public async Task<Result<UsersPageResponse>> HandleAsync(ListUsersRequest request, CancellationToken cancellationToken)
    {
        ValidationResult validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return validationResult.ToError();
        }

        DateTimeOffset? after = request.Cursor is string cursor && ListUsersValidator.TryParseCursor(cursor, out DateTimeOffset time) ? time : null;
        string? search = string.IsNullOrWhiteSpace(request.Search) ? null : request.Search.Trim();
        bool deletingSoon = request.DeletingSoon == true;

        // One more than a page, to know whether another page follows.
        List<UserListRow> rows = await userReadRepository.ListUsersAsync(search, deletingSoon, after, PageSize + 1, cancellationToken);
        List<UserListRow> page = rows.Take(PageSize).ToList();
        string? nextCursor = rows.Count > PageSize
            ? ListUsersValidator.FormatCursor(deletingSoon ? page[^1].DeletionScheduledForUtc!.Value : page[^1].CreatedAtUtc)
            : null;

        return new UsersPageResponse(
            page.Select(row => new UserListItemResponse(row.Id, row.Name, row.Email, row.LastActiveUtc, row.DeletionScheduledForUtc, row.IsClosed, row.HasPhoto)).ToList(),
            nextCursor);
    }
}
