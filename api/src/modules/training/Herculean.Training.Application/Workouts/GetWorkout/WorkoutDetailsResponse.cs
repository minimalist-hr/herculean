using System.ComponentModel;

using Herculean.Training.Domain.Workouts;

namespace Herculean.Training.Application.Workouts.GetWorkout;

[Description("A workout with its exercises and sets.")]
internal sealed record WorkoutDetailsResponse(
    [property: Description("The workout's ID.")] Guid Id,
    [property: Description("The date it belongs to.")] DateOnly Date,
    [property: Description("Where it stands.")] WorkoutStatus Status,
    [property: Description("Its name, from the routine when it was created.")] string Name,
    [property: Description("When logging started. Null when skipped, and on a past day, which has no elapsed time.")] DateTimeOffset? StartedAtUtc,
    [property: Description("Its exercises in order.")] List<WorkoutExerciseResponse> Exercises,
    [property: Description("When logging finished. Null until it's saved.")] DateTimeOffset? FinishedAtUtc = null,
    [property: Description("How long it took. Null until it's saved, and when it has no duration.")] int? DurationSeconds = null);

[Description("An exercise in a workout.")]
internal sealed record WorkoutExerciseResponse(
    [property: Description("This exercise's ID in the workout.")] Guid Id,
    [property: Description("The exercise's ID.")] Guid ExerciseId,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The ID of the group it belongs to.")] Guid GroupId,
    [property: Description("The name of the group it belongs to.")] string GroupName,
    [property: Description("The sets to do.")] int TargetSets,
    [property: Description("The low end of the rep range.")] int TargetRepsFrom,
    [property: Description("The high end of the rep range.")] int TargetRepsTo,
    [property: Description("Its sets in order.")] List<SetResponse> Sets,
    [property: Description("Its latest completed workout before this one. Null if never done.")] LastTimeResponse? LastTime);

[Description("An exercise's sets the last time it was done.")]
internal sealed record LastTimeResponse(
    [property: Description("The date it was done.")] DateOnly Date,
    [property: Description("Its sets in order.")] List<LastTimeSetResponse> Sets);

[Description("A set from last time.")]
internal sealed record LastTimeSetResponse(
    [property: Description("The weight in kg. 0 means bodyweight.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps);
