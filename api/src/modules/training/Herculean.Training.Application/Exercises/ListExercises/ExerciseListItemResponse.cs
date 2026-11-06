using System.ComponentModel;

namespace Herculean.Training.Application.Exercises.ListExercises;

[Description("An exercise in the list.")]
internal sealed record ExerciseListItemResponse(
    [property: Description("The exercise's ID.")] Guid Id,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The group it belongs to.")] Guid GroupId,
    [property: Description("The name of the group it belongs to.")] string GroupName,
    [property: Description("The heaviest weight, then the most reps at that weight, from checked sets in completed workouts. Null until the exercise has been done.")] BestSetResponse? BestSet);
