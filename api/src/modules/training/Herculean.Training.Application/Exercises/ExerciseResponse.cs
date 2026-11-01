using System.ComponentModel;

using Herculean.Training.Domain.Exercises;

namespace Herculean.Training.Application.Exercises;

[Description("An exercise.")]
internal sealed record ExerciseResponse(
    [property: Description("The exercise's ID.")] Guid Id,
    [property: Description("The exercise's name.")] string Name,
    [property: Description("The group it belongs to.")] Guid GroupId,
    [property: Description("The other groups it also works.")] List<Guid> AlsoWorksGroupIds)
{
    public static ExerciseResponse From(Exercise exercise) =>
        new(exercise.Id.Value, exercise.Name, exercise.GroupId.Value, [.. exercise.AlsoWorks.Select(alsoWorks => alsoWorks.GroupId.Value)]);
}
