using Herculean.Account.Application.Auth;
using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.EmailChanges.ResendEmailChange;

internal sealed class ResendEmailChangeHandler(
    CurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(CancellationToken cancellationToken)
    {
        User? user = await userRepository.GetByIdWithEmailChangeTokensAsync(currentUser.UserId, cancellationToken);
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        string? pendingEmail = user.PendingEmail(timeProvider.GetUtcNow());
        if (pendingEmail is null)
        {
            return UserErrors.NoPendingEmailChange;
        }

        outbox.Add(new EmailChangeRequestedIntegrationEvent(user.Id.Value, pendingEmail));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
