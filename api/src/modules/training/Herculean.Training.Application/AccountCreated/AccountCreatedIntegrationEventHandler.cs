using Herculean.Account.Contracts;
using Herculean.SharedKernel.Events;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Domain.Starter;

namespace Herculean.Training.Application.AccountCreated;

internal sealed class AccountCreatedIntegrationEventHandler(
    IWorkoutSettingsRepository workoutSettingsRepository,
    IGroupRepository groupRepository,
    IExerciseRepository exerciseRepository,
    IStarterGroupRepository starterGroupRepository,
    IStarterExerciseRepository starterExerciseRepository,
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
            await CopyStarterContentAsync(userId, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    /// <summary>Gives the account its own copy of the starter groups and exercises, as they are now.</summary>
    private async Task CopyStarterContentAsync(UserId userId, CancellationToken cancellationToken)
    {
        List<StarterGroup> starterGroups = await starterGroupRepository.ListAsync(cancellationToken);
        Dictionary<StarterGroupId, Group> groups = starterGroups
            .Select((starterGroup, order) => (starterGroup.Id, Group: Group.Create(userId, starterGroup.Name, order)))
            .ToDictionary(pair => pair.Id, pair => pair.Group);
        groupRepository.AddRange(groups.Values);

        foreach (StarterExercise starterExercise in await starterExerciseRepository.ListAsync(cancellationToken))
        {
            exerciseRepository.Add(Exercise.Create(
                userId,
                starterExercise.Name,
                groups[starterExercise.GroupId].Id,
                starterExercise.AlsoWorks.Select(alsoWorks => groups[alsoWorks.GroupId].Id)));
        }
    }
}
