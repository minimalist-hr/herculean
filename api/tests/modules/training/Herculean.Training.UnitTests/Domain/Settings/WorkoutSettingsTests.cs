using Herculean.Training.Domain;
using Herculean.Training.Domain.Settings;

namespace Herculean.Training.UnitTests.Domain.Settings;

public sealed class WorkoutSettingsTests
{
    [Fact]
    public void StartingSettingsRestNinetySecondsWithSoundAndVibrate()
    {
        UserId userId = UserId.From(Guid.CreateVersion7());

        WorkoutSettings workoutSettings = WorkoutSettings.CreateStarting(userId);

        workoutSettings.UserId.ShouldBe(userId);
        workoutSettings.DefaultRestSeconds.ShouldBe(90);
        workoutSettings.RestSound.ShouldBeTrue();
        workoutSettings.RestVibrate.ShouldBeTrue();
    }
}
