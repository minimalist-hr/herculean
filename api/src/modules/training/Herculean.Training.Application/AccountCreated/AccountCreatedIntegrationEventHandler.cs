using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.Application.AccountCreated;

internal sealed class AccountCreatedIntegrationEventHandler(
    IWorkoutSettingsRepository workoutSettingsRepository,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork) : IIntegrationEventHandler<AccountCreatedIntegrationEvent>
{
    public async Task HandleAsync(AccountCreatedIntegrationEvent @event, CancellationToken cancellationToken)
    {
        UserId userId = UserId.From(@event.UserId);

        // The outbox can send the event twice. The second time, the account is already set up.
        if (await workoutSettingsRepository.ExistsForUserAsync(userId, cancellationToken))
        {
            return;
        }

        workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(userId));
        groupRepository.AddRange(Group.CreateStarting(userId));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
