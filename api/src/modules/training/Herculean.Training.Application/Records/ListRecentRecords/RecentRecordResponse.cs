using System.ComponentModel;

namespace Herculean.Training.Application.Records.ListRecentRecords;

[Description("A set that beat the heaviest weight done on an exercise before.")]
internal sealed record RecentRecordResponse(
    [property: Description("The exercise's ID.")] Guid ExerciseId,
    [property: Description("The exercise's name.")] string ExerciseName,
    [property: Description("The weight in kg.")] decimal WeightKg,
    [property: Description("The reps at that weight.")] int Reps,
    [property: Description("The date of the workout, in the user's time zone.")] DateOnly Date);
