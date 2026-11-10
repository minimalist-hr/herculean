using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseSuperset;

[Description("Whether an exercise is a superset with the one after it.")]
internal sealed record UpdateWorkoutExerciseSupersetRequest(
    [property: Description("True pairs it with the exercise after it, false ends its superset. A superset is two exercises, so the last exercise and the second of a superset can't start one, and nor can the exercise before one.")] bool SupersetWithNext);
