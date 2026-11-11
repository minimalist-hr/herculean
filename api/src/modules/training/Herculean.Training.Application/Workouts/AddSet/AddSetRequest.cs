using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.AddSet;

[Description("A set to add to an exercise.")]
internal sealed record AddSetRequest(
    [property: Description("The removed set to put back, which is how a removal is undone. Left out, the new set copies the last set.")] RemovedSet? Removed = null);

[Description("A removed set to put back.")]
internal sealed record RemovedSet(
    [property: Description("Its place in the exercise, from 0.")] int Order,
    [property: Description("The weight in kg, 0 to 1,000 with up to two decimals. 0 means bodyweight.")] decimal WeightKg,
    [property: Description("The reps, 1 to 100.")] int Reps,
    [property: Description("Whether it was marked done.")] bool Checked,
    [property: Description("Whether lengthened partials were done after it.")] bool PartialsDone = false);
