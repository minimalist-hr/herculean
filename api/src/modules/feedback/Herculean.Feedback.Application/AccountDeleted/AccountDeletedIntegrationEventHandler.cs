using Herculean.Account.Contracts;
using Herculean.Feedback.Domain;
using Herculean.SharedKernel.Events;

namespace Herculean.Feedback.Application.AccountDeleted;

/// <summary>Deletes every ticket the user sent. If the outbox sends the event twice, the second finds nothing.</summary>
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
