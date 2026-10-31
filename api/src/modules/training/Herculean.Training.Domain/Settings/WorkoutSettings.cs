using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Settings;

internal sealed class WorkoutSettings : Entity<WorkoutSettingsId>
{
    internal const int StartingDefaultRestSeconds = 180;

    // The default rest time moves in 15 second steps, from 0:15 to 10:00.
    internal const int DefaultRestStepSeconds = 15;
    internal const int MinDefaultRestSeconds = 15;
    internal const int MaxDefaultRestSeconds = 600;

    private WorkoutSettings(WorkoutSettingsId id, UserId userId, int defaultRestSeconds, bool restSound, bool restVibrate) : base(id)
    {
        UserId = userId;
        DefaultRestSeconds = defaultRestSeconds;
        RestSound = restSound;
        RestVibrate = restVibrate;
    }

    public UserId UserId { get; private set; }

    public int DefaultRestSeconds { get; private set; }

    public bool RestSound { get; private set; }

    public bool RestVibrate { get; private set; }

    public static WorkoutSettings CreateStarting(UserId userId) =>
        new(WorkoutSettingsId.New(), userId, StartingDefaultRestSeconds, restSound: true, restVibrate: true);

    public void ChangeDefaultRest(int defaultRestSeconds)
    {
        DefaultRestSeconds = IsDefaultRest(defaultRestSeconds)
            ? defaultRestSeconds
            : throw new ArgumentOutOfRangeException(nameof(defaultRestSeconds), defaultRestSeconds, "Not a default rest time.");
    }

    public static bool IsDefaultRest(int seconds) =>
        seconds is >= MinDefaultRestSeconds and <= MaxDefaultRestSeconds && seconds % DefaultRestStepSeconds == 0;

    public void ChangeRestSound(bool restSound)
    {
        RestSound = restSound;
    }

    public void ChangeRestVibrate(bool restVibrate)
    {
        RestVibrate = restVibrate;
    }
}
