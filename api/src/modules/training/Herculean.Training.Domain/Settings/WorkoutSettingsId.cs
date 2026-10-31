using Herculean.SharedKernel.Entities;

namespace Herculean.Training.Domain.Settings;

internal readonly record struct WorkoutSettingsId(Guid Value) : ITypedId<WorkoutSettingsId>
{
    public static WorkoutSettingsId New() => new(Guid.CreateVersion7());

    public static WorkoutSettingsId From(Guid value) => new(value);
}
