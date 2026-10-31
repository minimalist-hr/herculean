using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Settings;

internal sealed class WorkoutSettings : Entity<WorkoutSettingsId>
{
    internal const int StartingDefaultRestSeconds = 90;

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
}
