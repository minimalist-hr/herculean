using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.CreateWorkout;

[Description("A workout to add to a date.")]
internal sealed record CreateWorkoutRequest(
    [property: Description("The date it belongs to.")] DateOnly Date,
    [property: Description("Where it starts: in progress to log it, or skipped.")] WorkoutStatus Status,
    [property: Description("The routine to start instead of the day's plan, for this date only. Only when starting. Without it, the day's planned routine is used.")] Guid? RoutineId = null,
    [property: Description("Starts with no routine and no exercises, named Workout until it is named. Only when starting, and never with a routine.")] bool Empty = false);
