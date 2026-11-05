using Herculean.Training.Application.Auth;
using Herculean.Training.Application.Settings;
using Herculean.Training.Application.Settings.GetWorkoutSettings;

namespace Herculean.Training.UnitTests.Application.Settings.GetWorkoutSettings;

public sealed class GetWorkoutSettingsHandlerTests
{
    private readonly FakeWorkoutSettingsReadRepository _readRepository = new();
    private readonly GetWorkoutSettingsHandler _handler;

    public GetWorkoutSettingsHandlerTests()
    {
        _handler = new GetWorkoutSettingsHandler(_readRepository, new CurrentUser(new FakeCurrentUserAccessor()));
    }

    [Fact]
    public async Task ReturnsTheSettings()
    {
        _readRepository.Settings = new WorkoutSettingsResponse(120, false, true);

        WorkoutSettingsResponse result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.ShouldBe(new WorkoutSettingsResponse(120, false, true));
    }

    [Fact]
    public async Task BeforeTheyExistItReturnsTheStartingOnes()
    {
        WorkoutSettingsResponse result = await _handler.HandleAsync(TestContext.Current.CancellationToken);

        result.ShouldBe(new WorkoutSettingsResponse(180, true, true));
    }
}
