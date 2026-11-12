using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.CloseUserAccount;

internal sealed class CloseUserAccountHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox,
    TimeProvider timeProvider)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        User? user = AdminUsers.OnlyUser(await userRepository.GetByIdWithAllTokensAsync(new UserId(id), cancellationToken));
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        if (user.IsClosed)
        {
            return Result.Success();
        }

        // An account the user already deleted keeps its date, so closing it never gives them longer.
        DateTimeOffset nowUtc = timeProvider.GetUtcNow();
        DateTimeOffset? waitingUntil = user.DeletionScheduledForUtc;
        user.Close(waitingUntil is null ? nowUtc : waitingUntil.Value - User.DeletionWait);
        outbox.Add(new AccountClosedIntegrationEvent(user.Email, user.DeletionScheduledForUtc!.Value, user.TimeZone));
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
