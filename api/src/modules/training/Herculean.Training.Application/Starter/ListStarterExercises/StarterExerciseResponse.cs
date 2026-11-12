using System.ComponentModel;

namespace Herculean.Training.Application.Starter.ListStarterExercises;

[Description("An exercise every new account starts with.")]
internal sealed record StarterExerciseResponse(
    [property: Description("The starter exercise's ID.")] Guid Id,
    [property: Description("Its name.")] string Name,
    [property: Description("The starter group it belongs to.")] Guid GroupId,
    [property: Description("Other starter groups it also works, which can be none.")] List<Guid> AlsoWorksGroupIds);
