using System.ComponentModel;

using Herculean.Training.Application.Groups.ListGroups;
using Herculean.Training.Application.Routines;

namespace Herculean.Training.Application.Exercises.GetExercise;

[Description("An exercise, its groups and its progress.")]
internal sealed record ExerciseDetailsResponse(
    [property: Description("The exercise's ID.")] Guid Id,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The group it belongs to.")] GroupResponse Group,
    [property: Description("The other groups it also works, in their order.")] List<GroupResponse> AlsoWorksGroups,
    [property: Description("The routines that have it, by name. It can't be deleted while there are any.")] List<RoutineResponse> Routines,
    [property: Description("The heaviest weight, then the most reps at that weight, from checked sets in completed workouts. Null until the exercise has been done.")] BestSetResponse? BestSet,
    [property: Description("The number of completed workouts with a checked set of it.")] int TimesDone,
    [property: Description("The date of the first of those workouts, in the user's time zone. Null until the exercise has been done.")] DateOnly? FirstDoneOn);
