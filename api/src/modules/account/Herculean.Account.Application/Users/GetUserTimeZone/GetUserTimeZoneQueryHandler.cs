using Herculean.Account.Contracts;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Queries;

namespace Herculean.Account.Application.Users.GetUserTimeZone;

internal sealed class GetUserTimeZoneQueryHandler(IUserReadRepository userReadRepository) : IQueryHandler<GetUserTimeZoneQuery, string>
{
    public Task<string> HandleAsync(GetUserTimeZoneQuery query, CancellationToken cancellationToken) =>
        userReadRepository.GetTimeZoneAsync(UserId.From(query.UserId), cancellationToken);
}
