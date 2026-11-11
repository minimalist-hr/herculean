using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.UpdateWorkoutExerciseLengthenedPartials;

[Description("Whether lengthened partials follow an exercise's sets in this workout.")]
internal sealed record UpdateWorkoutExerciseLengthenedPartialsRequest(
    [property: Description("True turns them on for this workout, false turns them off. The routine doesn't change.")] bool LengthenedPartials);
