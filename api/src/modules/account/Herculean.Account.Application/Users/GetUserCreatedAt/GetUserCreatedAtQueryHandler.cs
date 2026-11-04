using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Queries;

namespace Herculean.Account.Application.Users.GetUserCreatedAt;

internal sealed class GetUserCreatedAtQueryHandler(IUserReadRepository userReadRepository) : IQueryHandler<GetUserCreatedAtQuery, DateTimeOffset>
{
    public Task<DateTimeOffset> HandleAsync(GetUserCreatedAtQuery query, CancellationToken cancellationToken) =>
        userReadRepository.GetCreatedAtUtcAsync(UserId.From(query.UserId), cancellationToken);
}
