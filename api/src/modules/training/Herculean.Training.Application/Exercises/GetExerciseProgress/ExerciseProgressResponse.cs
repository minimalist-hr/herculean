using System.ComponentModel;

namespace Herculean.Training.Application.Exercises.GetExerciseProgress;

[Description("An exercise's heaviest sets over a range, oldest first.")]
internal sealed record ExerciseProgressResponse(
    [property: Description("True when the range has too many sessions to show each, so each point is a month's heaviest set.")] bool ByMonth,
    [property: Description("Each session's heaviest set, or each month's when byMonth is true, oldest first. Empty when the range has no sessions.")] List<ProgressPointResponse> Points);

[Description("A heaviest set: the most weight, then the most reps at that weight.")]
internal sealed record ProgressPointResponse(
    [property: Description("The workout's date, in the user's time zone.")] DateOnly Date,
    [property: Description("The weight in kg. A bodyweight set has 0.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps);
