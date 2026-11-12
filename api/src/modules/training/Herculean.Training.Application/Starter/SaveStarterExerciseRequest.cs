using System.ComponentModel;

using Herculean.Training.Application.Exercises;

namespace Herculean.Training.Application.Starter;

[Description("A starter exercise.")]
internal sealed record SaveStarterExerciseRequest(
    [property: Description("The name, 1 to 100 characters. Spaces around it are removed. It must differ from the other starter exercises, regardless of case.")] string Name,
    [property: Description("The starter group it belongs to.")] Guid GroupId,
    [property: Description("Other starter groups it also works. Optional. It can't repeat a group, or include the group it belongs to.")] List<Guid>? AlsoWorksGroupIds) : IExerciseFields;
