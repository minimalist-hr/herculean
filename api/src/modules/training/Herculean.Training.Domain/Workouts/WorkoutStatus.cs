using System.ComponentModel;

namespace Herculean.Training.Domain.Workouts;

[Description("Where a workout stands.")]
internal enum WorkoutStatus
{
    InProgress,
    Completed,
    Skipped,
}
