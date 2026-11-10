using Herculean.Account.Contracts;
using Herculean.Training.Application.AccountCreated;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Exercises;
using Herculean.Training.Domain.Groups;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.UnitTests.Application.AccountCreated;

public sealed class AccountCreatedIntegrationEventHandlerTests
{
    private static readonly Guid UserIdValue = Guid.CreateVersion7();
    private static readonly UserId UserId = UserId.From(UserIdValue);

    private readonly FakeWorkoutSettingsRepository _workoutSettingsRepository = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeExerciseRepository _exerciseRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly AccountCreatedIntegrationEventHandler _handler;

    public AccountCreatedIntegrationEventHandlerTests()
    {
        _handler = new AccountCreatedIntegrationEventHandler(_workoutSettingsRepository, _groupRepository, _exerciseRepository, _unitOfWork);
    }

    [Fact]
    public async Task NewAccountGetsWorkoutSettingsAndSixGroups()
    {
        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.ShouldHaveSingleItem().UserId.ShouldBe(UserId);
        _groupRepository.Groups.Count.ShouldBe(6);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task NewAccountGetsTheStarterExercisesInItsGroups()
    {
        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _exerciseRepository.Exercises.Count.ShouldBe(28);
        _exerciseRepository.Exercises.ShouldAllBe(exercise => exercise.UserId == UserId);
        Exercise pullUp = _exerciseRepository.Exercises.Single(exercise => exercise.Name == "Pull-up");
        pullUp.GroupId.ShouldBe(GroupNamed("Back").Id);
        pullUp.AlsoWorks.ShouldHaveSingleItem().GroupId.ShouldBe(GroupNamed("Biceps").Id);
    }

    private Group GroupNamed(string name) => _groupRepository.Groups.Single(group => group.Name == name);

    [Fact]
    public async Task SettingsMadeBySetupStillGetTheGroups()
    {
        _workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(UserId));

        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.Count.ShouldBe(1);
        _groupRepository.Groups.Count.ShouldBe(6);
    }

    [Fact]
    public async Task SameEventTwiceAddsNothing()
    {
        _workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(UserId));
        _groupRepository.AddRange(Group.CreateStarting(UserId));

        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.Count.ShouldBe(1);
        _groupRepository.Groups.Count.ShouldBe(6);
        _exerciseRepository.Exercises.ShouldBeEmpty();
    }
}
