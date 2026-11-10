using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.UpdateWorkout;

[Description("What changes on a workout.")]
internal sealed record UpdateWorkoutRequest(
    [property: Description("Where it stands now. Only completed can be set, which saves it.")] WorkoutStatus Status,
    [property: Description("How long it took in minutes, 1 to 600. Only a past day uses it: a timed workout counts its own.")] int? DurationMinutes = null);
