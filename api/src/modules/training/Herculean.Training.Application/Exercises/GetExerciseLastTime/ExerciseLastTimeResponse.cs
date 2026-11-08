using System.ComponentModel;

using Herculean.Training.Application.Workouts.GetWorkout;

namespace Herculean.Training.Application.Exercises.GetExerciseLastTime;

[Description("An exercise's sets the last time it was done.")]
internal sealed record ExerciseLastTimeResponse(
    [property: Description("Its latest completed workout before the date. Null when it wasn't done before then.")] LastTimeResponse? LastTime);
