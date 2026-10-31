using Herculean.SharedKernel.Results;
using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Settings;
using Herculean.Training.Application.Settings.UpdateWorkoutSettings;
using Herculean.Training.Domain;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.UnitTests.Application.Settings.UpdateWorkoutSettings;

public sealed class UpdateWorkoutSettingsHandlerTests
{
    private readonly FakeCurrentUserAccessor _currentUserAccessor = new();
    private readonly FakeWorkoutSettingsRepository _workoutSettingsRepository = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly UpdateWorkoutSettingsHandler _handler;

    public UpdateWorkoutSettingsHandlerTests()
    {
        _handler = new UpdateWorkoutSettingsHandler(
            new UpdateWorkoutSettingsValidator(), new CurrentUser(_currentUserAccessor), _workoutSettingsRepository, _unitOfWork);
    }

    private UserId UserId => UserId.From(_currentUserAccessor.UserId);

    [Fact]
    public async Task SentFieldsChangeAndTheSettingsComeBack()
    {
        _workoutSettingsRepository.Add(WorkoutSettings.CreateStarting(UserId));

        Result<WorkoutSettingsResponse> result = await _handler.HandleAsync(
            new UpdateWorkoutSettingsRequest(120, RestSound: false, RestVibrate: null),
            TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new WorkoutSettingsResponse(120, RestSound: false, RestVibrate: true));
        _workoutSettingsRepository.WorkoutSettings.ShouldHaveSingleItem().DefaultRestSeconds.ShouldBe(120);
        _unitOfWork.Saved.ShouldBeTrue();
    }

    [Fact]
    public async Task MissingSettingsAreCreatedWithTheirStartingValuesFirst()
    {
        Result<WorkoutSettingsResponse> result = await _handler.HandleAsync(
            new UpdateWorkoutSettingsRequest(60, RestSound: null, RestVibrate: null),
            TestContext.Current.CancellationToken);

        result.Value.ShouldBe(new WorkoutSettingsResponse(60, RestSound: true, RestVibrate: true));
        _workoutSettingsRepository.WorkoutSettings.ShouldHaveSingleItem().UserId.ShouldBe(UserId);
    }

    [Fact]
    public async Task InvalidRequestFailsWithFieldErrors()
    {
        Result<WorkoutSettingsResponse> result = await _handler.HandleAsync(
            new UpdateWorkoutSettingsRequest(70, RestSound: null, RestVibrate: null),
            TestContext.Current.CancellationToken);

        result.Error.ShouldNotBeNull().Fields.ShouldContainKey("defaultRestSeconds");
        _workoutSettingsRepository.WorkoutSettings.ShouldBeEmpty();
        _unitOfWork.Saved.ShouldBeFalse();
    }
}
