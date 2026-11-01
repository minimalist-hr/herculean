using System.ComponentModel;

namespace Herculean.Training.Application.Groups.ListGroups;

[Description("A group in the list.")]
internal sealed record GroupListItemResponse(
    [property: Description("The group's ID.")] Guid Id,
    [property: Description("The group's name.")] string Name,
    [property: Description("How many exercises use it, as their group or as also works. It can only be deleted at 0.")] int ExerciseCount);
