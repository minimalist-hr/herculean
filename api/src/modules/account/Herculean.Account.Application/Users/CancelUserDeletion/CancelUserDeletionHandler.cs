using Herculean.Account.Contracts;
using Herculean.Account.Domain;
using Herculean.Account.Domain.Users;
using Herculean.SharedKernel.Results;

namespace Herculean.Account.Application.Users.CancelUserDeletion;

internal sealed class CancelUserDeletionHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IOutbox outbox)
{
    public async Task<Result> HandleAsync(Guid id, CancellationToken cancellationToken)
    {
        User? user = AdminUsers.OnlyUser(await userRepository.GetByIdAsync(new UserId(id), cancellationToken));
        if (user is null)
        {
            return UserErrors.NotFound;
        }

        // Only an account that was going to be deleted has anything to be told.
        if (user.DeletionScheduledForUtc is not null)
        {
            outbox.Add(new AccountKeptIntegrationEvent(user.Id.Value));
        }

        user.CancelDeletion();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
