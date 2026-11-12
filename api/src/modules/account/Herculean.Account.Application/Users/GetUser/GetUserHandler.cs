using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.GetUser;

internal sealed class GetUserHandler(IUserReadRepository userReadRepository)
{
    public async Task<Result<AdminUserResponse>> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        AdminUserResponse? user = await userReadRepository.GetUserAsync(new UserId(id), cancellationToken);

        return user is null ? UserErrors.NotFound : user;
    }
}
