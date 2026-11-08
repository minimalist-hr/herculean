using Herculean.Account.Application.Auth;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.EmailChanges.GetPendingEmailChange;

internal sealed class GetPendingEmailChangeHandler(
    CurrentUser currentUser,
    IUserRepository userRepository,
    TimeProvider timeProvider)
{
    public async Task<Result<PendingEmailChangeResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdWithEmailChangeTokensAsync(currentUser.UserId, cancellationToken);

        return user is null
            ? UserErrors.NotFound
            : new PendingEmailChangeResponse(user.PendingEmail(timeProvider.GetUtcNow()));
    }
}
