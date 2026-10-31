using Herculean.Account.Contracts;
using Herculean.Training.Application.AccountCreated;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.UnitTests.Application.AccountCreated;

public sealed class AccountCreatedIntegrationEventHandlerTests
{
    private static readonly Guid UserIdValue = Guid.CreateVersion7();

    private readonly FakeWorkoutSettingsRepository _workoutSettingsRepository = new();
    private readonly FakeGroupRepository _groupRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly AccountCreatedIntegrationEventHandler _handler;

    public AccountCreatedIntegrationEventHandlerTests()
    {
        _handler = new AccountCreatedIntegrationEventHandler(_workoutSettingsRepository, _groupRepository, _unitOfWork);
    }

    [Fact]
    public async Task NewAccountGetsWorkoutSettingsAndSixGroups()
    {
        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.ShouldHaveSingleItem().UserId.ShouldBe(UserId.From(UserIdValue));
        _groupRepository.Groups.Count.ShouldBe(6);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task SameEventTwiceChangesNothing()
    {
        _workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(UserId.From(UserIdValue)));

        await _handler.HandleAsync(new AccountCreatedIntegrationEvent(UserIdValue), TestContext.Current.CancellationToken);

        _workoutSettingsRepository.WorkoutSettings.Count.ShouldBe(1);
        _groupRepository.Groups.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
    }
}
