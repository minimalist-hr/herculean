using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.Application.AccountCreated;

internal sealed class AccountCreatedIntegrationEventHandler(
    IWorkoutSettingsRepository workoutSettingsRepository,
    IGroupRepository groupRepository,
    IExerciseRepository exerciseRepository,
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

        // The starter exercises come with the groups, so they are added once too.
        if (!await groupRepository.AnyForUserAsync(userId, cancellationToken))
        {
            IReadOnlyList<Group> groups = Group.CreateStarting(userId);
            groupRepository.AddRange(groups);
            foreach (Exercise exercise in Exercise.CreateStarting(userId, groups))
            {
                exerciseRepository.Add(exercise);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
