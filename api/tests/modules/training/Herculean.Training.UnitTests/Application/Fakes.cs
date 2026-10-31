using Herculean.Training.Domain;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.UnitTests.Application;

internal sealed class FakeWorkoutSettingsRepository : IWorkoutSettingsRepository
{
    public List<WorkoutSettings> WorkoutSettings { get; } = [];

    public Task<bool> ExistsForUserAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(WorkoutSettings.Any(workoutSettings => workoutSettings.UserId == userId));

    public void Add(WorkoutSettings workoutSettings)
    {
        WorkoutSettings.Add(workoutSettings);
    }
}

internal sealed class FakeGroupRepository : IGroupRepository
{
    public List<Group> Groups { get; } = [];

    public void AddRange(IEnumerable<Group> groups)
    {
        Groups.AddRange(groups);
    }
}

internal sealed class FakeUnitOfWork : IUnitOfWork
{
    public bool Saved { get; private set; }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        Saved = true;

        return Task.CompletedTask;
    }
}
