using System.ComponentModel;

using Herculean.Training.Domain.Settings;

namespace Herculean.Training.Application.Settings;

[Description("The signed-in user's workout settings.")]
internal sealed record WorkoutSettingsResponse(
    [property: Description("The rest time that starts after every checked set, in seconds: 60, 90, 120, 150 or 180.")] int DefaultRestSeconds,
    [property: Description("Play a sound when the rest ends.")] bool RestSound,
    [property: Description("Vibrate when the rest ends.")] bool RestVibrate)
{
    public static WorkoutSettingsResponse From(WorkoutSettings workoutSettings) =>
        new(workoutSettings.DefaultRestSeconds, workoutSettings.RestSound, workoutSettings.RestVibrate);
}
