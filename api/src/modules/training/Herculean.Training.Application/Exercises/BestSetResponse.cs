using System.ComponentModel;

namespace Herculean.Training.Application.Exercises;

[Description("The best set of an exercise.")]
internal sealed record BestSetResponse(
    [property: Description("The weight in kg. A bodyweight set has 0.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps,
    [property: Description("The date of the first workout that did it, in the user's time zone.")] DateOnly Date);
