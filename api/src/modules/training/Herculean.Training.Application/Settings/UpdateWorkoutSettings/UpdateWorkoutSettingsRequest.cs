using System.ComponentModel;

namespace Herculean.Training.Application.Settings.UpdateWorkoutSettings;

[Description("The fields to change. A field left out, or null, stays the same.")]
internal sealed record UpdateWorkoutSettingsRequest(
    [property: Description("The rest time offered after a checked set, in seconds: a multiple of 15, from 15 to 600.")] int? DefaultRestSeconds = null,
    [property: Description("Play a sound when the rest ends.")] bool? RestSound = null,
    [property: Description("Vibrate when the rest ends.")] bool? RestVibrate = null);
