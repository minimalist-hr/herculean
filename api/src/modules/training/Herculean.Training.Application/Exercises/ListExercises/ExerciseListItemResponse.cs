using System.ComponentModel;

namespace Herculean.Training.Application.Exercises.ListExercises;

[Description("An exercise in the list.")]
internal sealed record ExerciseListItemResponse(
    [property: Description("The exercise's ID.")] Guid Id,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The group it belongs to.")] Guid GroupId,
    [property: Description("The name of the group it belongs to.")] string GroupName,
    [property: Description("The heaviest weight, then the most reps at that weight. Null until the exercise has been done.")] BestSetResponse? BestSet);

[Description("The best set of an exercise.")]
internal sealed record BestSetResponse(
    [property: Description("The weight in kg. A bodyweight set has 0.")] decimal WeightKg,
    [property: Description("The reps.")] int Reps,
    [property: Description("The date of the workout, in the user's time zone.")] DateOnly Date);
