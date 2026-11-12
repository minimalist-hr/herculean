using Herculean.Account.Contracts;
using Herculean.Training.Application.AccountCreated;
using Herculean.Training.Application.Auth;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;
using Herculean.Training.Domain.Starter;
using Herculean.Training.Infrastructure;
using Herculean.Training.Infrastructure.Starter;

using Microsoft.EntityFrameworkCore;

namespace Herculean.Training.UnitTests.Application.AccountCreated;

public sealed class AccountCreatedIntegrationEventHandlerTests : IDisposable
{
    private static readonly Guid UserIdValue = Guid.CreateVersion7();
    private static readonly UserId UserId = UserId.From(UserIdValue);

    private readonly FakeWorkoutSettingsRepository _workoutSettingsRepository = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly TrainingDbContext _starterDbContext = new(
        new DbContextOptionsBuilder<TrainingDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options,
        new CurrentUser(new FakeCurrentUserAccessor()));

    private readonly AccountCreatedIntegrationEventHandler _handler;

    public AccountCreatedIntegrationEventHandlerTests()
    {
        _handler = new AccountCreatedIntegrationEventHandler(
            _workoutSettingsRepository,
            _groupRepository,
            _exerciseRepository,
            new StarterGroupRepository(_starterDbContext),
            new StarterExerciseRepository(_starterDbContext),
            _unitOfWork);
    }

    [Fact]
    public async Task NewAccountGetsWorkoutSettingsAndTheStarterGroupsInOrder()
    {
        await SaveStarterContentAsync();

        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.ShouldHaveSingleItem().UserId.ShouldBe(UserId);
        _groupRepository.Groups.OrderBy(group => group.Order).Select(group => group.Name).ShouldBe(["Chest", "Back", "Biceps"]);
        _groupRepository.Groups.ShouldAllBe(group => group.UserId == UserId);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task NewAccountGetsTheStarterExercisesInItsOwnGroups()
    {
        await SaveStarterContentAsync();

        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _exerciseRepository.Exercises.Count.ShouldBe(2);
        _exerciseRepository.Exercises.ShouldAllBe(exercise => exercise.UserId == UserId);
        Exercise pullUp = _exerciseRepository.Exercises.Single(exercise => exercise.Name == "Pull-up");
        pullUp.GroupId.ShouldBe(GroupNamed("Back").Id);
        pullUp.AlsoWorks.ShouldHaveSingleItem().GroupId.ShouldBe(GroupNamed("Biceps").Id);
    }

    [Fact]
    public async Task NoStarterContentGivesNoGroups()
    {
        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.ShouldHaveSingleItem();
        _groupRepository.Groups.ShouldBeEmpty();
        _exerciseRepository.Exercises.ShouldBeEmpty();
    }

    [Fact]
    public async Task SettingsMadeBySetupStillGetTheGroups()
    {
        await SaveStarterContentAsync();
        _workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(UserId));

        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.Count.ShouldBe(1);
        _groupRepository.Groups.Count.ShouldBe(3);
    }

    [Fact]
    public async Task SameEventTwiceAddsNothing()
    {
        await SaveStarterContentAsync();
        _workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(UserId));
        _groupRepository.AddRange(TestGroups.Create(UserId));

        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.Count.ShouldBe(1);
        _groupRepository.Groups.Count.ShouldBe(6);
        _exerciseRepository.Exercises.ShouldBeEmpty();
    }

    public void Dispose()
    {
        _starterDbContext.Dispose();
    }

    private Group GroupNamed(string name) => _groupRepository.Groups.Single(group => group.Name == name);

    /// <summary>Three groups, saved out of order, and two exercises, one also working another group.</summary>
    private async Task SaveStarterContentAsync()
    {
        StarterGroup chest = StarterGroup.Create("Chest", 0);
        StarterGroup biceps = StarterGroup.Create("Biceps", 2);
        StarterGroup back = StarterGroup.Create("Back", 1);
        _starterDbContext.StarterGroups.AddRange(chest, biceps, back);
        _starterDbContext.StarterExercises.AddRange(
            StarterExercise.Create("Bench press", chest.Id, []),
            StarterExercise.Create("Pull-up", back.Id, [biceps.Id]));
        await _starterDbContext.SaveChangesAsync(TestContext.Current.CancellationToken);
        _starterDbContext.ChangeTracker.Clear();
    }
}
