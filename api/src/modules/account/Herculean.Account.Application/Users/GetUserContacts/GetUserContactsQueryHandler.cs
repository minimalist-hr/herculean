using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Queries;

namespace Herculean.Account.Application.Users.GetUserContacts;

internal sealed class GetUserContactsQueryHandler(IUserReadRepository userReadRepository) : IQueryHandler<GetUserContactsQuery, IReadOnlyList<UserContact>>
{
    public Task<IReadOnlyList<UserContact>> HandleAsync(GetUserContactsQuery query, CancellationToken cancellationToken) =>
        userReadRepository.ListContactsAsync([.. query.UserIds.Select(UserId.From)], cancellationToken);
}
