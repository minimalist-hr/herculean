using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.UpdateWorkout;

[Description("What changes on a workout.")]
internal sealed record UpdateWorkoutRequest(
    [property: Description("Where it stands now. Only completed can be set, which saves it.")] WorkoutStatus Status);
