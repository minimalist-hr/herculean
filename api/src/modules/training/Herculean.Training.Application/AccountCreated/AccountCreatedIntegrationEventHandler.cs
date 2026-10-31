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

        // Each part is checked on its own: the outbox can send the event twice,
        // and changing the workout settings creates them if they are not there yet.
        if (!await workoutSettingsRepository.ExistsForUserAsync(userId, cancellationToken))
        {
            workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(userId));
        }

        if (!await groupRepository.AnyForUserAsync(userId, cancellationToken))
        {
            groupRepository.AddRange(Group.CreateStarting(userId));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
