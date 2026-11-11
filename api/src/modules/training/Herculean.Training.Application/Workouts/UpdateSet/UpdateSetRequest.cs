using System.ComponentModel;

namespace Herculean.Training.Application.Workouts.UpdateSet;

[Description("The fields to change. A field left out, or null, stays the same.")]
internal sealed record UpdateSetRequest(
    [property: Description("The weight in kg, 0 to 1,000 with up to two decimals. 0 means bodyweight.")] decimal? WeightKg = null,
    [property: Description("The reps, 1 to 100.")] int? Reps = null,
    [property: Description("Whether it is marked done.")] bool? Checked = null,
    [property: Description("Whether lengthened partials were done after it.")] bool? PartialsDone = null);
