using Herculean.Training.Application.Settings.UpdateWorkoutSettings;

namespace Herculean.Training.UnitTests.Application.Settings.UpdateWorkoutSettings;

public sealed class UpdateWorkoutSettingsValidatorTests
{
    private readonly UpdateWorkoutSettingsValidator _validator = new();

    [Theory]
    [InlineData(null)]
    [InlineData(60)]
    [InlineData(180)]
    public void ChosenRestTimePasses(int? defaultRestSeconds)
    {
        _validator.Validate(new UpdateWorkoutSettingsRequest(defaultRestSeconds, RestSound: false, RestVibrate: null)).IsValid.ShouldBeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(75)]
    [InlineData(240)]
    public void OtherRestTimeFails(int defaultRestSeconds)
    {
        _validator.Validate(new UpdateWorkoutSettingsRequest(defaultRestSeconds, RestSound: null, RestVibrate: null))
            .Errors.ShouldContain(failure => failure.PropertyName == nameof(UpdateWorkoutSettingsRequest.DefaultRestSeconds));
    }
}
