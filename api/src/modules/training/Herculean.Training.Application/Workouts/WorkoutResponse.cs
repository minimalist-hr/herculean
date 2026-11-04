using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts;

[Description("A workout.")]
internal sealed record WorkoutResponse(
    [property: Description("The workout's ID.")] Guid Id,
    [property: Description("The date it belongs to.")] DateOnly Date,
    [property: Description("Where it stands.")] WorkoutStatus Status,
    [property: Description("Its name, from the routine when it was created.")] string Name);
