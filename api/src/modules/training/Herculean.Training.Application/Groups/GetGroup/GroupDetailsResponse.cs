using System.ComponentModel;

using Herculean.Training.Application.Exercises.ListExercises;

namespace Herculean.Training.Application.Groups.GetGroup;

[Description("A group and the exercises that use it.")]
internal sealed record GroupDetailsResponse(
    [property: Description("The group's ID.")] Guid Id,
    [property: Description("The group's name.")] string Name,
    [property: Description("The exercises that belong to it, by name.")] List<ExerciseListItemResponse> Exercises,
    [property: Description("The exercises that also work it, by name.")] List<ExerciseListItemResponse> AlsoWorksExercises);
