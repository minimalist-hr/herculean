using System.ComponentModel;

namespace Herculean.Training.Application.Exercises.ListExerciseSessions;

[Description("A page of an exercise's sessions, newest first.")]
internal sealed record ExerciseSessionsResponse(
    [property: Description("The sessions on this page.")] List<ExerciseSessionResponse> Sessions,
    [property: Description("Every month this page has sessions in, newest first, with all of that month's sessions counted.")] List<SessionMonthResponse> Months,
    [property: Description("Pass it as cursor for the next page. Null on the last page.")] string? NextCursor);

[Description("A completed workout with checked sets of the exercise.")]
internal sealed record ExerciseSessionResponse(
    [property: Description("The workout's ID.")] Guid WorkoutId,
    [property: Description("The workout's date, in the user's time zone.")] DateOnly Date,
    [property: Description("The workout's name.")] string WorkoutName,
    [property: Description("The checked sets, in their order.")] List<SessionSetResponse> Sets);

[Description("A checked set in a session.")]
internal sealed record SessionSetResponse(
    [property: Description("The weight in kg. A bodyweight set has 0.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps);

[Description("A month of sessions.")]
internal sealed record SessionMonthResponse(
    [property: Description("The month, as yyyy-MM.")] string Month,
    [property: Description("The number of sessions in it.")] int Sessions);
