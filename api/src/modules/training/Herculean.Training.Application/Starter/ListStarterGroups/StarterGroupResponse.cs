using System.ComponentModel;

namespace Herculean.Training.Application.Starter.ListStarterGroups;

[Description("A group every new account starts with.")]
internal sealed record StarterGroupResponse(
    [property: Description("The starter group's ID.")] Guid Id,
    [property: Description("Its name.")] string Name,
    [property: Description("How many starter exercises belong to it.")] int ExerciseCount);
