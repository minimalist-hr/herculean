using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.AddWorkoutExercises;

[Description("Exercises to add to a workout: new ones, or a removed one to put back.")]
internal sealed record AddWorkoutExercisesRequest(
    [property: Description("The exercises to add at the end, with the starting targets. Their sets start from last time.")] List<Guid>? ExerciseIds = null,
    [property: Description("The removed exercise to put back, which is how a removal is undone.")] RemovedExercise? Removed = null,
    [property: Description("Adds the two exercises as a superset: the first is done with the second, a set of each, then rest.")] bool AsSuperset = false);

[Description("A removed exercise to put back.")]
internal sealed record RemovedExercise(
    [property: Description("Its place in the workout, from 0.")] int Order,
    [property: Description("The exercise's ID.")] Guid ExerciseId,
    [property: Description("The sets to do, 1 to 20.")] int TargetSets,
    [property: Description("The low end of the rep range, 1 to 100.")] int TargetRepsFrom,
    [property: Description("The high end of the rep range, 1 to 100.")] int TargetRepsTo,
    [property: Description("Its sets in order, 1 to 20.")] List<RemovedExerciseSet> Sets,
    [property: Description("Whether it was a superset with the exercise after it.")] bool SupersetWithNext = false,
    [property: Description("Whether it was a superset with the exercise before it.")] bool SupersetWithPrevious = false);

[Description("A set of a removed exercise.")]
internal sealed record RemovedExerciseSet(
    [property: Description("The weight in kg, 0 to 1,000 with up to two decimals. 0 means bodyweight.")] decimal WeightKg,
    [property: Description("The reps, 1 to 100.")] int Reps,
    [property: Description("Whether it was marked done.")] bool Checked);
