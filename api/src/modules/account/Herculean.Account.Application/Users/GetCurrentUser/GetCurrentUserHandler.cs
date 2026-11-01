using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.GetCurrentUser;

internal sealed class GetCurrentUserHandler(CurrentUser currentUser, IUserRepository userRepository)
{
    public async Task<Result<UserResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdAsync(currentUser.UserId, cancellationToken);

        return user is null ? UserErrors.NotFound : UserResponse.From(user);
    }
}
