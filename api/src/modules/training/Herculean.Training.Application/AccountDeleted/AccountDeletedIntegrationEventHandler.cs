using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;
using Herculean.Training.Domain;

namespace Herculean.Training.Application.AccountDeleted;

/// <summary>Deletes everything the user has. If the outbox sends the event twice, the second finds nothing.</summary>
internal sealed class AccountDeletedIntegrationEventHandler(
    IUserDataRepository userDataRepository,
    IUnitOfWork unitOfWork) : IIntegrationEventHandler<AccountDeletedIntegrationEvent>
{
    public async Task HandleAsync(AccountDeletedIntegrationEvent @event, CancellationToken cancellationToken)
    {
        await userDataRepository.RemoveAllAsync(UserId.From(@event.UserId), cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
