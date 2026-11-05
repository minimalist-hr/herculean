using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseOrder;

[Description("The order of a workout's exercises.")]
internal sealed record UpdateWorkoutExerciseOrderRequest(
    [property: Description("Every exercise in the workout, by its ID in the workout, once each, in the new order.")] List<Guid> WorkoutExerciseIds);
