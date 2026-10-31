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

    [Fact]
    public void ChangesAreKept()
    {
        WorkoutSettings workoutSettings = WorkoutSettings.CreateStarting(UserId.From(Guid.CreateVersion7()));

        workoutSettings.ChangeDefaultRest(150);
        workoutSettings.ChangeRestSound(false);
        workoutSettings.ChangeRestVibrate(false);

        workoutSettings.DefaultRestSeconds.ShouldBe(150);
        workoutSettings.RestSound.ShouldBeFalse();
        workoutSettings.RestVibrate.ShouldBeFalse();
    }

    [Fact]
    public void RestTimeOutsideTheChoicesIsABug()
    {
        WorkoutSettings workoutSettings = WorkoutSettings.CreateStarting(UserId.From(Guid.CreateVersion7()));

        Should.Throw<ArgumentOutOfRangeException>(() => workoutSettings.ChangeDefaultRest(75));
    }
}
