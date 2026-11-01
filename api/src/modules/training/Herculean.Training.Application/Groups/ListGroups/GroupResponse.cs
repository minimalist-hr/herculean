using System.ComponentModel;

namespace Herculean.Training.Application.Groups.ListGroups;

[Description("A muscle group. It orders the exercise list and the chips.")]
internal sealed record GroupResponse(
    [property: Description("The group's ID.")] Guid Id,
    [property: Description("The group's name.")] string Name);
