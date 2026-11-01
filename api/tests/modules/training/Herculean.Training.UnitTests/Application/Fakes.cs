using Herculean.SharedKernel.Auth;
using Herculean.Training.Application.Exercises;
using Herculean.Training.Application.Exercises.GetExercise;
using Herculean.Training.Application.Exercises.ListExercises;
using Herculean.Training.Application.Groups;
using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.UnitTests.Application;

internal sealed class FakeCurrentUserAccessor : ICurrentUserAccessor
{
    public Guid UserId { get; set; } = Guid.CreateVersion7();
}

internal sealed class FakeWorkoutSettingsRepository : IWorkoutSettingsRepository
{
    public List<WorkoutSettings> WorkoutSettings { get; } = [];

    public Task<WorkoutSettings?> GetForCurrentUserAsync(CancellationToken cancellationToken) =>
        Task.FromResult(WorkoutSettings.SingleOrDefault());

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

    public Task<bool> AnyForUserAsync(UserId userId, CancellationToken cancellationToken) =>
        Task.FromResult(Groups.Any(group => group.UserId == userId));

    public Task<List<GroupId>> ListIdsAsync(CancellationToken cancellationToken) =>
        Task.FromResult(Groups.Select(group => group.Id).ToList());

    public void AddRange(IEnumerable<Group> groups)
    {
        Groups.AddRange(groups);
    }
}

internal sealed class FakeGroupReadRepository : IGroupReadRepository
{
    public List<GroupResponse> Groups { get; } = [];

    public Task<List<GroupResponse>> ListAsync(CancellationToken cancellationToken) => Task.FromResult(Groups);
}

internal sealed class FakeExerciseReadRepository : IExerciseReadRepository
{
    public List<ExerciseListItemResponse> Exercises { get; } = [];

    public List<ExerciseDetailsResponse> Details { get; } = [];

    public string? Search { get; private set; }

    public GroupId? GroupId { get; private set; }

    public Task<List<ExerciseListItemResponse>> ListAsync(string? search, GroupId? groupId, CancellationToken cancellationToken)
    {
        Search = search;
        GroupId = groupId;

        return Task.FromResult(Exercises);
    }

    public Task<ExerciseDetailsResponse?> GetAsync(ExerciseId id, CancellationToken cancellationToken) =>
        Task.FromResult(Details.SingleOrDefault(exercise => exercise.Id == id.Value));
}

internal sealed class FakeExerciseRepository : IExerciseRepository
{
    public List<Exercise> Exercises { get; } = [];

    /// <summary>The count to report, so a test needs no 500 exercises.</summary>
    public int? Count { get; set; }

    public Task<int> CountAsync(CancellationToken cancellationToken) => Task.FromResult(Count ?? Exercises.Count);

    public Task<Exercise?> GetAsync(ExerciseId id, CancellationToken cancellationToken) =>
        Task.FromResult(Exercises.SingleOrDefault(exercise => exercise.Id == id && exercise.DeletedAtUtc is null));

    public Task<bool> NameExistsAsync(string name, ExerciseId? exceptId, CancellationToken cancellationToken) =>
        Task.FromResult(Exercises.Any(exercise =>
            exercise.DeletedAtUtc is null && exercise.Id != exceptId && exercise.NormalizedName == Exercise.NormalizeName(name)));

    public void Add(Exercise exercise)
    {
        Exercises.Add(exercise);
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
