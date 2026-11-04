using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.CreateWorkout;

[Description("A workout to add to a date.")]
internal sealed record CreateWorkoutRequest(
    [property: Description("The date it belongs to.")] DateOnly Date,
    [property: Description("Where it stands. Only skipped for now.")] WorkoutStatus Status);
