using System.ComponentModel;

using Herculean.Training.Application.Groups.ListGroups;

namespace Herculean.Training.Application.Exercises.GetExercise;

[Description("An exercise and its groups.")]
internal sealed record ExerciseDetailsResponse(
    [property: Description("The exercise's ID.")] Guid Id,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The group it belongs to.")] GroupResponse Group,
    [property: Description("The other groups it also works, in their order.")] List<GroupResponse> AlsoWorksGroups);
