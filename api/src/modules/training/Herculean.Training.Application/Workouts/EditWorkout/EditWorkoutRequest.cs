using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.EditWorkout;

[Description("A saved workout as edited: all its exercises in order, each with all its sets.")]
internal sealed record EditWorkoutRequest(
    [property: Description("Its exercises in order, 1 to 30, each exercise once. Exercises left out are removed.")] List<EditedWorkoutExercise> Exercises,
    [property: Description("How long it took in minutes, 1 to 600. Null means no duration.")] int? DurationMinutes = null);

[Description("An exercise of the edited workout.")]
internal sealed record EditedWorkoutExercise(
    [property: Description("The workout exercise's ID, or null for an exercise added while editing.")] Guid? Id,
    [property: Description("The exercise's ID.")] Guid ExerciseId,
    [property: Description("Its sets in order, 1 to 20. Every set of a saved workout counts as done.")] List<EditedWorkoutSet> Sets,
    [property: Description("Whether it is a superset with the exercise after it. A superset is two exercises, so the last exercise and the second of a superset can't start one.")] bool SupersetWithNext = false,
    [property: Description("Whether lengthened partials follow each set: half reps at the stretched end, right after the set.")] bool LengthenedPartials = false);

[Description("A set of the edited workout.")]
internal sealed record EditedWorkoutSet(
    [property: Description("The weight in kg, 0 to 1,000 with up to two decimals. 0 means bodyweight.")] decimal WeightKg,
    [property: Description("The reps, 1 to 100.")] int Reps,
    [property: Description("Whether lengthened partials were done after it.")] bool PartialsDone = false);
